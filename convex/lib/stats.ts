import { MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { updateElo } from "./elo";

// ── stat lookups ────────────────────────────────────────────────────────────

export async function getStat(
  ctx: MutationCtx,
  toolId: Id<"tools">,
  category: string,
  segment: string,
): Promise<Doc<"toolStats"> | null> {
  return await ctx.db
    .query("toolStats")
    .withIndex("by_cat_segment", (q) =>
      q.eq("category", category).eq("segment", segment),
    )
    .filter((q) => q.eq(q.field("toolId"), toolId))
    .unique();
}

export async function getOrCreateStat(
  ctx: MutationCtx,
  toolId: Id<"tools">,
  category: string,
  segment: string,
): Promise<Doc<"toolStats">> {
  const existing = await getStat(ctx, toolId, category, segment);
  if (existing) return existing;

  // Seed a new (usually segment-level) row off the overall "all" row.
  const base = segment !== "all" ? await getStat(ctx, toolId, category, "all") : null;
  const id = await ctx.db.insert("toolStats", {
    toolId,
    category,
    segment,
    elo: base?.elo ?? 1500,
    wins: 0,
    losses: 0,
    ties: 0,
    battles: 0,
    winRate: 0,
    cost: base?.cost ?? 1,
    costUnit: base?.costUnit ?? "",
    easeScore: base?.easeScore ?? 3,
    speedMs: base?.speedMs ?? 1000,
    coverage: base?.coverage,
  });
  return (await ctx.db.get(id))!;
}

// ── battle result → Elo + win/loss/tie ──────────────────────────────────────

// scoreA ∈ {1, 0.5, 0}. Returns the new Elo of each tool on this board.
export async function applyBattleResult(
  ctx: MutationCtx,
  category: string,
  segment: string,
  toolAId: Id<"tools">,
  toolBId: Id<"tools">,
  scoreA: number,
  k = 24,
): Promise<{ aElo: number; bElo: number }> {
  const a = await getOrCreateStat(ctx, toolAId, category, segment);
  const b = await getOrCreateStat(ctx, toolBId, category, segment);

  const [aElo, bElo] = updateElo(a.elo, b.elo, scoreA, k);

  const aWin = scoreA === 1 ? 1 : 0;
  const aLoss = scoreA === 0 ? 1 : 0;
  const draw = scoreA === 0.5 ? 1 : 0;

  const aWins = a.wins + aWin;
  const aLosses = a.losses + aLoss;
  const aTies = a.ties + draw;
  const aBattles = a.battles + 1;
  await ctx.db.patch(a._id, {
    elo: aElo,
    wins: aWins,
    losses: aLosses,
    ties: aTies,
    battles: aBattles,
    winRate: aBattles ? aWins / aBattles : 0,
  });

  const bWins = b.wins + aLoss; // B wins when A loses
  const bLosses = b.losses + aWin;
  const bTies = b.ties + draw;
  const bBattles = b.battles + 1;
  await ctx.db.patch(b._id, {
    elo: bElo,
    wins: bWins,
    losses: bLosses,
    ties: bTies,
    battles: bBattles,
    winRate: bBattles ? bWins / bBattles : 0,
  });

  return { aElo, bElo };
}

// ── race result → rolling objective stats + pairwise Elo tournament ─────────

const ema = (prev: number, next: number, alpha: number) =>
  prev * (1 - alpha) + next * alpha;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function applyRaceResult(
  ctx: MutationCtx,
  race: Doc<"races">,
  cells: Doc<"raceCells">[],
): Promise<void> {
  const perProvider = race.providerToolIds.map((tid) => {
    const filled = cells.filter((c) => c.toolId === tid && c.status === "filled");
    const valid = filled.filter((c) => c.fields?.emailValid).length;
    const totalCost = filled.reduce((s, c) => s + (c.cost ?? 0), 0);
    const coverage = filled.length
      ? filled.reduce((s, c) => s + (c.coverage ?? 0), 0) / filled.length
      : 0;
    const avgLatency = filled.length
      ? filled.reduce((s, c) => s + (c.latencyMs ?? 0), 0) / filled.length
      : 0;
    const validity = filled.length ? valid / filled.length : 0;
    const costPerValid = valid ? totalCost / valid : null;
    // Composite reward: validity & coverage up, cost & latency down.
    const composite =
      validity * 0.5 +
      coverage * 0.3 -
      Math.min(costPerValid ?? 1, 1) * 0.15 -
      (avgLatency / 3000) * 0.05;
    return { tid, costPerValid, coverage, avgLatency, validity, composite };
  });

  // Roll the objective metrics into the enrichment leaderboard.
  for (const p of perProvider) {
    const stat = await getStat(ctx, p.tid, "enrichment", "all");
    if (!stat) continue;
    const alpha = 0.4;
    await ctx.db.patch(stat._id, {
      coverage: ema(stat.coverage ?? p.coverage, p.coverage, alpha),
      cost:
        p.costPerValid != null
          ? round2(ema(stat.cost, p.costPerValid, alpha))
          : stat.cost,
      speedMs: Math.round(ema(stat.speedMs, p.avgLatency, alpha)),
    });
  }

  // Pairwise Elo: a mini round-robin tournament by composite score (small K).
  const ranked = [...perProvider].sort((x, y) => y.composite - x.composite);
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) {
      await applyBattleResult(
        ctx,
        "enrichment",
        "all",
        ranked[i].tid,
        ranked[j].tid,
        1,
        8,
      );
    }
  }
}
