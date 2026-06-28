import { mutation } from "./_generated/server";

// Additive seed for the two new categories — inserts only what's missing, so it
// never wipes existing tools/Elo/rankings/profiles.
//   convex run seedExtra:add

function h(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}

const CATEGORIES = [
  {
    key: "ai-sdr",
    name: "AI SDR",
    tagline: "Autonomous agents that prospect, personalize, and book meetings.",
    icon: "Bot",
    mode: "battle",
    dimensions: ["quality", "affordability", "ease", "speed"],
    order: 6,
    enabled: true,
    blurb: "Autonomous outbound agents (AI BDRs) that research, write, and send.",
  },
  {
    key: "intent-signals",
    name: "Intent & Signals",
    tagline: "Surface warm accounts and buying signals before your competitors.",
    icon: "Radar",
    mode: "battle",
    dimensions: ["quality", "affordability", "ease"],
    order: 7,
    enabled: true,
    blurb: "Website de-anonymization, intent data, and signal orchestration.",
  },
];

type Stat = { elo: number; cost: number; costUnit: string; ease: number; speedMs: number };
type T = {
  slug: string;
  name: string;
  url: string;
  logoText: string;
  blurb: string;
  categories: string[];
  segments: string[];
  pricingModel: string;
  freeTier: boolean;
  auth: string;
  openSource: boolean;
  docsQuality: number;
  maintenance: string;
  productionReady: boolean;
  stats: Record<string, Stat>;
};

const TOOLS: T[] = [
  // AI SDR ---------------------------------------------------------------------
  { slug: "11x", name: "11x", url: "https://11x.ai", logoText: "11", blurb: "Digital workers (Alice) that run autonomous outbound end-to-end.", categories: ["ai-sdr"], segments: ["mid", "ent", "us"], pricingModel: "paid", freeTier: false, auth: "oauth", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1545, cost: 5000, costUnit: "/mo", ease: 3.8, speedMs: 1400 } } },
  { slug: "artisan", name: "Artisan", url: "https://artisan.co", logoText: "AR", blurb: "Ava, an AI BDR that automates the full outbound cycle.", categories: ["ai-sdr"], segments: ["smb", "mid", "us"], pricingModel: "paid", freeTier: false, auth: "oauth", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1530, cost: 1500, costUnit: "/mo", ease: 4.0, speedMs: 1300 } } },
  { slug: "aisdr", name: "AiSDR", url: "https://aisdr.com", logoText: "AI", blurb: "AI SDR for personalized email + LinkedIn outreach at scale.", categories: ["ai-sdr"], segments: ["smb", "mid", "global"], pricingModel: "paid", freeTier: false, auth: "api_key", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1500, cost: 900, costUnit: "/mo", ease: 4.1, speedMs: 1200 } } },
  { slug: "relevance-ai", name: "Relevance AI", url: "https://relevanceai.com", logoText: "RE", blurb: "Build custom AI agents (Bosh the BDR) for GTM work.", categories: ["ai-sdr"], segments: ["smb", "mid", "global"], pricingModel: "freemium", freeTier: true, auth: "api_key", openSource: false, docsQuality: 4, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1515, cost: 199, costUnit: "/mo", ease: 3.6, speedMs: 1500 } } },
  { slug: "qualified", name: "Qualified", url: "https://qualified.com", logoText: "QU", blurb: "Piper, an AI SDR that converts inbound website traffic.", categories: ["ai-sdr"], segments: ["mid", "ent", "us"], pricingModel: "paid", freeTier: false, auth: "oauth", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1525, cost: 3000, costUnit: "/mo", ease: 3.9, speedMs: 1100 } } },
  { slug: "regie-ai", name: "Regie.ai", url: "https://regie.ai", logoText: "RG", blurb: "Auto-Pilot AI agents for prospecting and outbound content.", categories: ["ai-sdr"], segments: ["mid", "ent", "us"], pricingModel: "paid", freeTier: false, auth: "api_key", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "ai-sdr": { elo: 1490, cost: 2000, costUnit: "/mo", ease: 3.7, speedMs: 1250 } } },

  // Intent & Signals -----------------------------------------------------------
  { slug: "common-room", name: "Common Room", url: "https://commonroom.com", logoText: "CR", blurb: "Unify signals across web, product, and community into one platform.", categories: ["intent-signals"], segments: ["mid", "ent", "us", "global"], pricingModel: "paid", freeTier: true, auth: "oauth", openSource: false, docsQuality: 4, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1540, cost: 999, costUnit: "/mo", ease: 3.7, speedMs: 1200 } } },
  { slug: "koala", name: "Koala", url: "https://getkoala.com", logoText: "KO", blurb: "Website intent + visitor de-anonymization for warm outbound.", categories: ["intent-signals"], segments: ["smb", "mid", "us"], pricingModel: "freemium", freeTier: true, auth: "api_key", openSource: false, docsQuality: 4, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1525, cost: 0, costUnit: "/mo", ease: 4.3, speedMs: 900 } } },
  { slug: "rb2b", name: "RB2B", url: "https://rb2b.com", logoText: "RB", blurb: "Identify anonymous US website visitors straight to Slack.", categories: ["intent-signals"], segments: ["smb", "us"], pricingModel: "freemium", freeTier: true, auth: "none", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1510, cost: 0, costUnit: "/mo", ease: 4.5, speedMs: 800 } } },
  { slug: "warmly", name: "Warmly", url: "https://warmly.ai", logoText: "WA", blurb: "Signal-based revenue orchestration and warm outreach.", categories: ["intent-signals"], segments: ["smb", "mid", "us"], pricingModel: "paid", freeTier: true, auth: "oauth", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1500, cost: 700, costUnit: "/mo", ease: 4.0, speedMs: 1100 } } },
  { slug: "default", name: "Default", url: "https://default.com", logoText: "DF", blurb: "Inbound capture, routing, and enrichment around buying signals.", categories: ["intent-signals"], segments: ["smb", "mid", "us"], pricingModel: "paid", freeTier: false, auth: "api_key", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1495, cost: 750, costUnit: "/mo", ease: 3.8, speedMs: 1000 } } },
  { slug: "vector", name: "Vector", url: "https://vector.co", logoText: "VE", blurb: "Contact-level intent to find buyers who are in-market now.", categories: ["intent-signals"], segments: ["mid", "ent", "us"], pricingModel: "paid", freeTier: false, auth: "api_key", openSource: false, docsQuality: 3, maintenance: "active", productionReady: true, stats: { "intent-signals": { elo: 1505, cost: 500, costUnit: "/mo", ease: 3.9, speedMs: 1050 } } },
];

export const add = mutation({
  args: {},
  handler: async (ctx) => {
    for (const c of CATEGORIES) {
      const exists = await ctx.db
        .query("categories")
        .withIndex("by_key", (q) => q.eq("key", c.key))
        .unique();
      if (!exists) await ctx.db.insert("categories", c as any);
    }

    let added = 0;
    for (const t of TOOLS) {
      const exists = await ctx.db
        .query("tools")
        .withIndex("by_slug", (q) => q.eq("slug", t.slug))
        .unique();
      if (exists) continue;
      const { stats, ...tool } = t;
      const id = await ctx.db.insert("tools", tool as any);
      for (const [category, st] of Object.entries(stats)) {
        await ctx.db.insert("toolStats", {
          toolId: id, category, segment: "all",
          elo: st.elo, wins: 0, losses: 0, ties: 0, battles: 0, winRate: 0,
          cost: st.cost, costUnit: st.costUnit, easeScore: st.ease, speedMs: st.speedMs,
        });
        for (const seg of t.segments) {
          const offset = (h(`${t.slug}|${category}|${seg}`) % 80) - 40;
          await ctx.db.insert("toolStats", {
            toolId: id, category, segment: seg,
            elo: st.elo + offset, wins: 0, losses: 0, ties: 0, battles: 0, winRate: 0,
            cost: st.cost, costUnit: st.costUnit, easeScore: st.ease, speedMs: st.speedMs,
          });
        }
      }
      added++;
    }
    return { categories: CATEGORIES.length, toolsAdded: added };
  },
});
