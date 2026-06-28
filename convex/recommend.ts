import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { chatJSON, classifyModel } from "./lib/openai";

// "Best tool for my use case." The LLM routes the free-text need to one of the
// fixed categories (+ light constraints); the answer is pulled from the latest
// stored ranking for that category.
export const bestTool = action({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    const cats = await ctx.runQuery(api.categories.list);
    const catList = cats.map((c: any) => ({
      key: c.key,
      name: c.name,
      about: c.tagline,
    }));

    const system =
      "You route a GTM/RevOps user's need to the single best-fitting tool category " +
      "and extract any light constraints. Only choose from the provided categories.";
    const user =
      `User need: "${query}"\n\nCategories:\n${JSON.stringify(catList)}\n\n` +
      `Return JSON: {"category": "<one key>", "needsFreeTier": true|false, ` +
      `"priority": "quality"|"affordability"|"ease"|"speed"|null, ` +
      `"note": "<= 18 words on why this category fits"}`;

    const cls = await chatJSON(classifyModel(), system, user);
    const category =
      cls?.category && cats.some((c: any) => c.key === cls.category)
        ? cls.category
        : cats[0].key;
    const categoryName = cats.find((c: any) => c.key === category)?.name ?? category;

    // Pull the answer from the stored ranking; fall back to the Elo leaderboard.
    const ranking = await ctx.runQuery(api.rankings.getLatest, { category });
    let entries: any[] =
      ranking?.entries?.map((e: any) => ({
        slug: e.slug,
        name: e.name,
        logoText: e.logoText,
        freeTier: e.freeTier,
        score: e.score,
        rationale: e.rationale,
      })) ?? [];
    let source = ranking ? "llm-ranking" : "leaderboard";

    if (!entries.length) {
      const board = await ctx.runQuery(api.leaderboard.get, { category });
      entries = board.map((r: any) => ({
        slug: r.slug,
        name: r.name,
        logoText: r.logoText,
        freeTier: r.freeTier,
        score: r.elo,
        rationale: "",
      }));
    }

    // Apply the one common constraint: "free" → prefer tools with a free tier.
    let pool = entries;
    if (cls?.needsFreeTier) {
      const free = entries.filter((e) => e.freeTier);
      if (free.length) pool = free;
    }

    return {
      query,
      category,
      categoryName,
      note: cls?.note ?? "",
      model: ranking?.model ?? null,
      source,
      best: pool[0] ?? null,
      alternatives: pool.slice(1, 3),
    };
  },
});
