import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { webSearchJSON } from "./lib/openai";

const str = (x: any) => (typeof x === "string" ? x : x == null ? "" : String(x));
const arr = (x: any) => (Array.isArray(x) ? x.map(str).map((s) => s.trim()).filter(Boolean) : []);
const bool = (x: any) => (typeof x === "boolean" ? x : undefined);
function domainOf(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

// Research one tool with GPT-5.5 web search → normalized wiki profile → store.
export const profileTool = action({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const data = await ctx.runQuery(api.tools.getProfile, { slug });
    if (!data) throw new Error(`Tool "${slug}" not found`);
    const tool = data.tool;

    const prompt =
      `Use web search to research the GTM tool "${tool.name}" (${tool.url ?? slug}). ` +
      `Be accurate and CURRENT — use real prices and real company facts. ` +
      `Return ONLY one minified JSON object with EXACTLY these keys:\n` +
      `{"summary":"one sentence","description":"2-3 sentences","bestFor":"who/what it is best for",` +
      `"differentiators":["2-4 things that set it apart"],` +
      `"pricing":[{"tier":"name","price":"$X/mo or usage","notes":"limits"}],` +
      `"freeTier":true,"pricingNotes":"short note",` +
      `"features":["5-10 concrete real features"],"integrations":["..."],"apiAvailable":true,` +
      `"pros":["2-4"],"cons":["2-4"],"alternatives":["3-5 competitor names"],` +
      `"company":{"founded":"year","hq":"city, country","teamSize":"e.g. 11-50 employees",` +
      `"funding":"e.g. $16M Series A","linkedinUrl":"https://..."},` +
      `"website":"https://...","sources":[{"title":"","url":"https://..."}]}\n` +
      `Provide 3-5 real source URLs. Use "" or [] when genuinely unknown.`;

    const out = await webSearchJSON(prompt);
    if (!out) throw new Error("Research failed (check OPENAI_API_KEY / model)");

    const website = str(out.website) || tool.url || "";
    const profile = {
      slug,
      summary: str(out.summary),
      description: str(out.description),
      website: website || undefined,
      logoDomain: domainOf(website || tool.url),
      bestFor: str(out.bestFor) || undefined,
      differentiators: arr(out.differentiators),
      pricing: Array.isArray(out.pricing)
        ? out.pricing
            .map((p: any) => ({
              tier: str(p?.tier),
              price: str(p?.price),
              notes: p?.notes ? str(p.notes) : undefined,
            }))
            .filter((p: any) => p.tier || p.price)
        : [],
      freeTier: bool(out.freeTier),
      pricingNotes: str(out.pricingNotes) || undefined,
      features: arr(out.features),
      integrations: arr(out.integrations),
      apiAvailable: bool(out.apiAvailable),
      pros: arr(out.pros),
      cons: arr(out.cons),
      alternatives: arr(out.alternatives),
      company: {
        founded: str(out.company?.founded) || undefined,
        hq: str(out.company?.hq) || undefined,
        teamSize: str(out.company?.teamSize) || undefined,
        funding: str(out.company?.funding) || undefined,
        linkedinUrl: str(out.company?.linkedinUrl) || undefined,
      },
      sources: Array.isArray(out.sources)
        ? out.sources
            .map((s: any) => ({ title: str(s?.title) || str(s?.url), url: str(s?.url) }))
            .filter((s: any) => s.url.startsWith("http"))
        : [],
      model: "gpt-5.5",
    };

    await ctx.runMutation(internal.research.saveProfile, { profile });
    return { slug, features: profile.features.length, sources: profile.sources.length };
  },
});

export const saveProfile = internalMutation({
  args: { profile: v.any() },
  handler: async (ctx, { profile }) => {
    const doc = { ...profile, updatedAt: Date.now() };
    const existing = await ctx.db
      .query("toolProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", profile.slug))
      .unique();
    if (existing) await ctx.db.replace(existing._id, doc);
    else await ctx.db.insert("toolProfiles", doc);
  },
});

export const getProfile = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("toolProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// Research every tool (staggered to respect rate limits): convex run research:profileAll
export const profileAll = action({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.runQuery(api.tools.list, {});
    let i = 0;
    for (const t of tools) {
      await ctx.scheduler.runAfter(i * 5000, api.research.profileTool, { slug: t.slug });
      i++;
    }
    return { scheduled: tools.length };
  },
});

// Research only tools that don't have a profile yet (e.g. newly added ones).
export const profileMissing = action({
  args: {},
  handler: async (ctx) => {
    const tools = await ctx.runQuery(api.tools.list, {});
    let i = 0;
    for (const t of tools) {
      const existing = await ctx.runQuery(api.research.getProfile, { slug: t.slug });
      if (existing) continue;
      await ctx.scheduler.runAfter(i * 5000, api.research.profileTool, { slug: t.slug });
      i++;
    }
    return { scheduled: i };
  },
});
