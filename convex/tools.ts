import { v } from "convex/values";
import { query } from "./_generated/server";

// Directory listing, optionally scoped to a category.
export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    const tools = await ctx.db.query("tools").collect();
    const filtered = category
      ? tools.filter((t) => t.categories.includes(category))
      : tools;
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Tool Profile — one tool across every category it competes in, with rank
// badges ("#1 Enrichment · SMB"-style data).
export const getProfile = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!tool) return null;

    const stats = await ctx.db
      .query("toolStats")
      .withIndex("by_tool", (q) => q.eq("toolId", tool._id))
      .collect();

    const badges = [];
    for (const s of stats.filter((x) => x.segment === "all")) {
      const peers = await ctx.db
        .query("toolStats")
        .withIndex("by_cat_segment", (q) =>
          q.eq("category", s.category).eq("segment", "all"),
        )
        .collect();
      peers.sort((a, b) => b.elo - a.elo);
      const rank = peers.findIndex((p) => p._id === s._id) + 1;
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_key", (q) => q.eq("key", s.category))
        .unique();
      badges.push({
        category: s.category,
        categoryName: cat?.name ?? s.category,
        rank,
        of: peers.length,
        elo: Math.round(s.elo),
        cost: s.cost,
        costUnit: s.costUnit,
        easeScore: s.easeScore,
        speedMs: s.speedMs,
        coverage: s.coverage,
      });
    }
    badges.sort((a, b) => a.rank - b.rank);

    return { tool, badges, segments: tool.segments };
  },
});
