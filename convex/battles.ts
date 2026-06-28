import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { applyBattleResult } from "./lib/stats";

const battleResult = v.union(
  v.literal("A"),
  v.literal("B"),
  v.literal("tie"),
  v.literal("bothBad"),
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Create the next blind battle for a category. Returns anonymized outputs only
// — identities are revealed by castVote. (LMArena logic.)
export const next = mutation({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const tasks = await ctx.db
      .query("battleTasks")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
    if (tasks.length === 0) {
      throw new Error(`No battle tasks seeded for category "${category}"`);
    }

    // Try a few tasks until we find one with >= 2 distinct tool samples.
    for (const task of shuffle(tasks)) {
      const samples = await ctx.db
        .query("samples")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      // de-dupe to one sample per tool
      const byTool = new Map<string, Doc<"samples">>();
      for (const s of samples) if (!byTool.has(s.toolId)) byTool.set(s.toolId, s);
      const distinct = shuffle([...byTool.values()]);
      if (distinct.length < 2) continue;

      const [a, b] = distinct;
      const contestants = [
        { label: "A", toolId: a.toolId, output: a.output },
        { label: "B", toolId: b.toolId, output: b.output },
      ];
      const battleId = await ctx.db.insert("battles", {
        category,
        taskId: task._id,
        task: task.prompt,
        contestants,
        status: "open",
        createdAt: Date.now(),
      });
      return {
        battleId,
        category,
        task: task.prompt,
        context: task.context ?? null,
        contestants: contestants.map((c) => ({ label: c.label, output: c.output })),
      };
    }
    throw new Error(`No task with >= 2 tool samples for category "${category}"`);
  },
});

// Sanitized read of an existing battle (used to re-hydrate; no identities while open).
export const get = query({
  args: { battleId: v.id("battles") },
  handler: async (ctx, { battleId }) => {
    const battle = await ctx.db.get(battleId);
    if (!battle) return null;
    if (battle.status === "open") {
      return {
        battleId,
        category: battle.category,
        task: battle.task,
        status: battle.status,
        contestants: battle.contestants.map((c) => ({
          label: c.label,
          output: c.output,
        })),
      };
    }
    return { battleId, category: battle.category, task: battle.task, status: battle.status };
  },
});

async function reveal(ctx: any, battle: Doc<"battles">, elos: Record<string, number>) {
  return await Promise.all(
    battle.contestants.map(async (c) => {
      const t = await ctx.db.get(c.toolId as Id<"tools">);
      return {
        label: c.label,
        output: c.output,
        toolId: c.toolId,
        slug: t?.slug,
        name: t?.name,
        logoText: t?.logoText,
        url: t?.url,
        blurb: t?.blurb,
        pricingModel: t?.pricingModel,
        freeTier: t?.freeTier,
        openSource: t?.openSource,
        elo: Math.round(elos[c.toolId] ?? 1500),
      };
    }),
  );
}

// Cast a vote → update Elo on the overall board + every segment both tools
// share → reveal identities. Works for human voters and LLM judges.
export const castVote = mutation({
  args: {
    battleId: v.id("battles"),
    result: battleResult,
    voterId: v.optional(v.string()),
    judgeType: v.optional(v.union(v.literal("human"), v.literal("llm"))),
    judgeModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) throw new Error("Battle not found");

    const [A, B] = battle.contestants;
    const scoreA =
      args.result === "A" ? 1 : args.result === "B" ? 0 : 0.5;

    await ctx.db.insert("votes", {
      battleId: args.battleId,
      category: battle.category,
      result: args.result,
      voterId: args.voterId,
      judgeType: args.judgeType ?? "human",
      judgeModel: args.judgeModel,
      createdAt: Date.now(),
    });

    // Boards to update: overall + segments shared by both contestants.
    const toolA = await ctx.db.get(A.toolId);
    const toolB = await ctx.db.get(B.toolId);
    const shared = (toolA?.segments ?? []).filter((s) =>
      (toolB?.segments ?? []).includes(s),
    );
    const boards = ["all", ...shared];

    let overall = { aElo: 1500, bElo: 1500 };
    for (const seg of boards) {
      const res = await applyBattleResult(
        ctx,
        battle.category,
        seg,
        A.toolId,
        B.toolId,
        scoreA,
      );
      if (seg === "all") overall = res;
    }

    if (battle.status !== "voted") {
      await ctx.db.patch(args.battleId, { status: "voted", result: args.result });
    }

    const elos: Record<string, number> = {
      [A.toolId]: overall.aElo,
      [B.toolId]: overall.bElo,
    };
    return { result: args.result, reveal: await reveal(ctx, battle, elos) };
  },
});
