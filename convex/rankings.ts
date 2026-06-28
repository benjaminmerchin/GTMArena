import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { chatJSON, rankModel } from "./lib/openai";

const num = (x: any) => {
  const n = Number(x);
  return isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
};

// Ask the LLM to rank the tools in a category, then store the ordered result.
export const generate = action({
  args: { category: v.string(), model: v.optional(v.string()) },
  handler: async (ctx, { category, model }) => {
    const cat = await ctx.runQuery(api.categories.get, { key: category });
    if (!cat) throw new Error(`Unknown category "${category}"`);

    const tools = await ctx.runQuery(api.tools.list, { category });
    const board = await ctx.runQuery(api.leaderboard.get, { category });
    const stat = new Map(board.map((r: any) => [r.slug, r]));

    // Compact, model-friendly view of each tool: specs + arena signals.
    const data = tools.map((t) => {
      const s: any = stat.get(t.slug) ?? {};
      return {
        slug: t.slug,
        name: t.name,
        what: t.blurb,
        pricing: t.pricingModel,
        startingUsd: t.startingPriceUsd ?? null,
        freeTier: t.freeTier,
        auth: t.auth,
        openSource: t.openSource,
        docsQuality: t.docsQuality,
        maintenance: t.maintenance,
        productionReady: t.productionReady,
        arena: {
          elo: s.elo,
          winRate: s.winRate,
          cost: s.cost != null ? `$${s.cost}${s.costUnit ?? ""}` : null,
          ease: s.easeScore,
          speedMs: s.speedMs,
          coverage: s.coverage,
        },
      };
    });

    const usedModel = model ?? rankModel();
    const system =
      "You are a senior GTM/RevOps tooling analyst. You rank low-level GTM tools " +
      "for a typical growth team. Be opinionated and decisive, grounded in the " +
      "provided specs and the crowd+LLM 'arena' signals (Elo, win-rate). Weigh the " +
      "dimensions that matter for this category.";
    const user =
      `Category: ${cat.name} — ${cat.tagline}\n` +
      `Dimensions that matter most: ${cat.dimensions.join(", ")}\n\n` +
      `Tools (JSON):\n${JSON.stringify(data)}\n\n` +
      `Return JSON: {"ranking":[{"slug": "...", "score": 0-100, "quality": 0-100, ` +
      `"affordability": 0-100, "ease": 0-100, "speed": 0-100, "rationale": "<= 18 words"}]} ` +
      `ordered BEST to WORST. Use the exact slugs given. Score holistically.`;

    const out = await chatJSON(usedModel, system, user);
    if (!out?.ranking || !Array.isArray(out.ranking)) {
      throw new Error(
        "LLM ranking failed — is OPENAI_API_KEY set and OPENAI_RANK_MODEL valid?",
      );
    }

    const slugToId = new Map(tools.map((t) => [t.slug, t._id]));
    const entries = out.ranking
      .filter((r: any) => slugToId.has(r.slug))
      .map((r: any, i: number) => ({
        toolId: slugToId.get(r.slug)!,
        rank: i + 1,
        score: num(r.score),
        scores: {
          quality: num(r.quality),
          affordability: num(r.affordability),
          ease: num(r.ease),
          speed: num(r.speed),
        },
        rationale: String(r.rationale ?? "").slice(0, 240),
      }));

    if (!entries.length) throw new Error("LLM returned no recognizable tools");

    await ctx.runMutation(internal.rankings.save, {
      category,
      model: usedModel,
      entries,
    });
    return { category, model: usedModel, count: entries.length };
  },
});

export const save = internalMutation({
  args: {
    category: v.string(),
    model: v.string(),
    entries: v.array(
      v.object({
        toolId: v.id("tools"),
        rank: v.number(),
        score: v.number(),
        scores: v.object({
          quality: v.optional(v.number()),
          affordability: v.optional(v.number()),
          ease: v.optional(v.number()),
          speed: v.optional(v.number()),
        }),
        rationale: v.string(),
      }),
    ),
  },
  handler: async (ctx, a) => {
    await ctx.db.insert("rankings", { ...a, createdAt: Date.now() });
  },
});

// Latest stored ranking for a category, joined with tool display fields.
export const getLatest = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const r = await ctx.db
      .query("rankings")
      .withIndex("by_category", (q) => q.eq("category", category))
      .order("desc")
      .first();
    if (!r) return null;
    const entries = await Promise.all(
      r.entries.map(async (e) => {
        const t = await ctx.db.get(e.toolId);
        return {
          ...e,
          slug: t?.slug,
          name: t?.name,
          logoText: t?.logoText,
          freeTier: t?.freeTier,
          pricingModel: t?.pricingModel,
        };
      }),
    );
    return { model: r.model, createdAt: r.createdAt, entries };
  },
});

// Rank every category (run once after seeding): convex run rankings:generateAll
export const generateAll = action({
  args: { model: v.optional(v.string()) },
  handler: async (ctx, { model }) => {
    const cats = await ctx.runQuery(api.categories.list);
    const results = [];
    for (const c of cats) {
      try {
        results.push(await ctx.runAction(api.rankings.generate, { category: c.key, model }));
      } catch (e: any) {
        results.push({ category: c.key, error: String(e?.message ?? e) });
      }
    }
    return results;
  },
});
