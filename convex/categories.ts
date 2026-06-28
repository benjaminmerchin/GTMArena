import { v } from "convex/values";
import { query } from "./_generated/server";

// Hub screen — category cards with a "top tool" teaser + counts.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db.query("categories").withIndex("by_order").collect();
    return await Promise.all(
      cats.map(async (c) => {
        const stats = await ctx.db
          .query("toolStats")
          .withIndex("by_cat_segment", (q) =>
            q.eq("category", c.key).eq("segment", "all"),
          )
          .collect();
        stats.sort((a, b) => b.elo - a.elo);
        let topTool = null;
        if (stats[0]) {
          const t = await ctx.db.get(stats[0].toolId);
          if (t) topTool = { slug: t.slug, name: t.name, elo: Math.round(stats[0].elo) };
        }
        return { ...c, topTool, toolCount: stats.length };
      }),
    );
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
  },
});

// Global "Top GTM Tools" strip on the hub — highest Elo across all categories.
export const globalTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const allStats = await ctx.db
      .query("toolStats")
      .filter((q) => q.eq(q.field("segment"), "all"))
      .collect();
    allStats.sort((a, b) => b.elo - a.elo);
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const s of allStats) {
      const key = s.toolId;
      if (seen.has(key)) continue;
      seen.add(key);
      const t = await ctx.db.get(s.toolId);
      if (!t) continue;
      rows.push({
        slug: t.slug,
        name: t.name,
        logoText: t.logoText,
        category: s.category,
        elo: Math.round(s.elo),
      });
      if (rows.length >= (limit ?? 8)) break;
    }
    return rows;
  },
});
