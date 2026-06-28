import { v } from "convex/values";
import { query } from "./_generated/server";
import { dimension } from "./schema";
import { sortStats, SortKey } from "./lib/ranking";

const dimToSort: Record<string, SortKey> = {
  quality: "quality",
  affordability: "affordability",
  ease: "ease",
  speed: "speed",
};

// Per-category leaderboard, sortable by any of the four dimensions and
// filterable by segment (vertical / geo / size). Default sort = Quality.
export const get = query({
  args: {
    category: v.string(),
    segment: v.optional(v.string()),
    sort: v.optional(dimension),
  },
  handler: async (ctx, { category, segment, sort }) => {
    const seg = segment ?? "all";
    const sortKey = dimToSort[sort ?? "quality"];

    const stats = await ctx.db
      .query("toolStats")
      .withIndex("by_cat_segment", (q) =>
        q.eq("category", category).eq("segment", seg),
      )
      .collect();

    const sorted = sortStats(stats, sortKey);

    return await Promise.all(
      sorted.map(async (s, i) => {
        const t = await ctx.db.get(s.toolId);
        return {
          rank: i + 1,
          toolId: s.toolId,
          slug: t?.slug ?? "",
          name: t?.name ?? "Unknown",
          logoText: t?.logoText,
          elo: Math.round(s.elo),
          winRate: s.winRate,
          battles: s.battles,
          cost: s.cost,
          costUnit: s.costUnit,
          easeScore: s.easeScore,
          speedMs: s.speedMs,
          coverage: s.coverage,
          pricingModel: t?.pricingModel,
          freeTier: t?.freeTier,
          openSource: t?.openSource,
        };
      }),
    );
  },
});
