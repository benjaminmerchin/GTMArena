import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { tokenRouterJSON } from "./lib/openai";
import { applyBattleResult } from "./lib/stats";

// A cheap model from each provider — battles rotate across them.
export const MODELS = [
  "openai/gpt-5.4-nano",
  "deepseek/deepseek-v3.2",
  "x-ai/grok-4.1-fast",
  "anthropic/claude-haiku-4.5",
  "google/gemini-3.5-flash",
];

const PRETTY: Record<string, string> = {
  "openai/gpt-5.4-nano": "GPT-5.4 nano",
  "deepseek/deepseek-v3.2": "DeepSeek V3.2",
  "x-ai/grok-4.1-fast": "Grok 4.1",
  "anthropic/claude-haiku-4.5": "Claude Haiku 4.5",
  "google/gemini-3.5-flash": "Gemini 3.5 Flash",
};
const pretty = (m: string) => PRETTY[m] ?? m;

// ── blind anonymization (so the judge never sees the brand) ─────────────────
function redactName(text: string, name: string): string {
  if (!text) return "";
  const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(safe, "gi"), "the tool");
}

function profileFacts(name: string, p: any): string {
  const r = (s: string) => redactName(s ?? "", name);
  const out: string[] = [];
  if (p.summary) out.push("Summary: " + r(p.summary));
  if (p.bestFor) out.push("Best for: " + r(p.bestFor));
  if (Array.isArray(p.pricing) && p.pricing.length)
    out.push("Pricing: " + p.pricing.map((x: any) => `${x.tier} ${x.price}`).join("; "));
  if (typeof p.freeTier === "boolean") out.push("Free tier: " + (p.freeTier ? "yes" : "no"));
  if (Array.isArray(p.features) && p.features.length)
    out.push("Features: " + p.features.slice(0, 8).map(r).join("; "));
  if (Array.isArray(p.pros) && p.pros.length) out.push("Pros: " + p.pros.map(r).join("; "));
  if (Array.isArray(p.cons) && p.cons.length) out.push("Cons: " + p.cons.map(r).join("; "));
  return out.join("\n");
}

// ── reset (kill the seeded bias; rebuild Elo purely from battles) ───────────
export const resetElo = mutation({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("toolStats").collect();
    for (const s of stats)
      await ctx.db.patch(s._id, { elo: 1500, wins: 0, losses: 0, ties: 0, battles: 0, winRate: 0 });
    const old = await ctx.db.query("judgedBattles").collect();
    for (const b of old) await ctx.db.delete(b._id);
    return { statsReset: stats.length, battlesCleared: old.length };
  },
});

// Eligible contestants in a category (only tools with a wiki profile), with
// their anonymized facts. Deterministic — randomness happens in the action.
export const eligible = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const cat = await ctx.db
      .query("categories")
      .withIndex("by_key", (q) => q.eq("key", category))
      .unique();
    const tools = (await ctx.db.query("tools").collect()).filter((t) =>
      t.categories.includes(category),
    );
    const list: { id: any; name: string; facts: string }[] = [];
    for (const t of tools) {
      const p = await ctx.db
        .query("toolProfiles")
        .withIndex("by_slug", (q) => q.eq("slug", t.slug))
        .unique();
      if (p) list.push({ id: t._id, name: t.name, facts: profileFacts(t.name, p) });
    }
    return { categoryName: cat?.name ?? category, tools: list };
  },
});

export const recordBattle = internalMutation({
  args: {
    category: v.string(),
    aId: v.id("tools"),
    bId: v.id("tools"),
    aName: v.string(),
    bName: v.string(),
    winner: v.union(v.literal("A"), v.literal("B"), v.literal("tie")),
    model: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, a) => {
    const scoreA = a.winner === "A" ? 1 : a.winner === "B" ? 0 : 0.5;
    await applyBattleResult(ctx, a.category, "all", a.aId, a.bId, scoreA, 16);
    const winnerName = a.winner === "A" ? a.aName : a.winner === "B" ? a.bName : undefined;
    await ctx.db.insert("judgedBattles", { ...a, winnerName, createdAt: Date.now() });
  },
});

// One blind battle: pick 2 random contestants, a rotating model judges, store it.
export const runBattle = internalAction({
  args: { category: v.string(), model: v.string() },
  handler: async (ctx, { category, model }) => {
    const e = await ctx.runQuery(internal.arena.eligible, { category });
    if (!e || e.tools.length < 2) return;
    const i = Math.floor(Math.random() * e.tools.length);
    let j = Math.floor(Math.random() * e.tools.length);
    while (j === i) j = Math.floor(Math.random() * e.tools.length);
    const A = e.tools[i];
    const B = e.tools[j];

    const system =
      "You are an impartial GTM/RevOps tooling analyst. Compare two tools in a " +
      "category for a typical growth team and pick the better one OVERALL, judging " +
      "ONLY the facts given (pricing, free tier, features, pros, cons, fit). You do " +
      "NOT know the brand names — judge on merit. Be decisive.";
    const user =
      `Category: ${e.categoryName}\n\nTOOL A:\n${A.facts}\n\nTOOL B:\n${B.facts}\n\n` +
      `Which is the better overall ${e.categoryName} tool? ` +
      `Reply ONLY JSON: {"winner":"A"|"B"|"tie","reason":"<=15 words"}`;

    const out = await tokenRouterJSON(model, system, user);
    const w = out?.winner;
    if (w !== "A" && w !== "B" && w !== "tie") return;
    await ctx.runMutation(internal.arena.recordBattle, {
      category,
      aId: A.id,
      bId: B.id,
      aName: A.name,
      bName: B.name,
      winner: w,
      model,
      reason: String(out.reason ?? "").slice(0, 160),
    });
  },
});

// Schedule N battles, rotating categories AND models round-robin.
//   convex run arena:runBattles '{"count":1000}'
export const runBattles = action({
  args: { count: v.optional(v.number()), category: v.optional(v.string()) },
  handler: async (ctx, { count, category }) => {
    const n = count ?? 200;
    const cats = category
      ? [category]
      : (await ctx.runQuery(api.categories.list)).map((c: any) => c.key);
    for (let i = 0; i < n; i++) {
      await ctx.scheduler.runAfter(i * 180, internal.arena.runBattle, {
        category: cats[i % cats.length],
        model: MODELS[i % MODELS.length],
      });
    }
    return { scheduled: n, models: MODELS };
  },
});

// ── reads (battle history + stats) ──────────────────────────────────────────
export const recentBattles = query({
  args: { limit: v.optional(v.number()), category: v.optional(v.string()) },
  handler: async (ctx, { limit, category }) => {
    const rows = category
      ? await ctx.db
          .query("judgedBattles")
          .withIndex("by_category", (q) => q.eq("category", category))
          .order("desc")
          .take(limit ?? 40)
      : await ctx.db.query("judgedBattles").order("desc").take(limit ?? 40);
    return rows.map((b) => ({
      _id: b._id,
      category: b.category,
      aName: b.aName,
      bName: b.bName,
      winner: b.winner,
      winnerName: b.winnerName ?? null,
      model: pretty(b.model),
      reason: b.reason,
      createdAt: b.createdAt,
    }));
  },
});

export const battleStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("judgedBattles").collect();
    const byModel: Record<string, number> = {};
    for (const b of all) byModel[pretty(b.model)] = (byModel[pretty(b.model)] ?? 0) + 1;
    return { total: all.length, byModel };
  },
});
