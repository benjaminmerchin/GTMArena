import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
  internalMutation,
  internalAction,
  action,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { webSearchJSON } from "./lib/openai";
import { Id } from "./_generated/dataModel";
import {
  DEFAULT_LEADS,
  simulateEnrich,
  realEnrich,
  Lead,
  RequestedField,
  ProviderProfile,
  EnrichResult,
} from "./lib/enrich";
import { applyRaceResult, getStat } from "./lib/stats";

const DEFAULT_FIELDS: RequestedField[] = ["email", "title", "linkedin", "phone"];

const leadValidator = v.object({
  id: v.string(),
  name: v.optional(v.string()),
  company: v.optional(v.string()),
  domain: v.optional(v.string()),
  title: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  email: v.optional(v.string()),
});

const fieldsValidator = v.object({
  email: v.optional(v.string()),
  emailValid: v.optional(v.boolean()),
  phone: v.optional(v.string()),
  title: v.optional(v.string()),
  linkedin: v.optional(v.string()),
});

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ── create a race + schedule the live, staggered fill ───────────────────────
export const createRace = mutation({
  args: {
    name: v.optional(v.string()),
    providerSlugs: v.optional(v.array(v.string())),
    leads: v.optional(v.array(leadValidator)),
    requestedFields: v.optional(v.array(v.string())),
    useReal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const category = "enrichment";

    let providerIds: Id<"tools">[] = [];
    if (args.providerSlugs && args.providerSlugs.length) {
      for (const slug of args.providerSlugs) {
        const t = await ctx.db
          .query("tools")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        if (t) providerIds.push(t._id);
      }
    } else {
      const stats = await ctx.db
        .query("toolStats")
        .withIndex("by_cat_segment", (q) =>
          q.eq("category", category).eq("segment", "all"),
        )
        .collect();
      stats.sort((a, b) => b.elo - a.elo);
      providerIds = stats.slice(0, 4).map((s) => s.toolId);
    }
    if (providerIds.length < 2) {
      throw new Error("Need at least 2 enrichment providers (seed the data first)");
    }

    const leads: Lead[] = args.leads?.length ? args.leads : DEFAULT_LEADS;
    const requestedFields =
      (args.requestedFields as RequestedField[] | undefined) ?? DEFAULT_FIELDS;

    const raceId = await ctx.db.insert("races", {
      category,
      name: args.name ?? "Enrichment Race — Law-firm leads",
      leads,
      providerToolIds: providerIds,
      requestedFields,
      status: "running",
      createdAt: Date.now(),
    });

    // Each provider fills its leads at its own pace, so the fast ones visibly
    // pull ahead. This is what makes the race feel live — backed by real Convex
    // reactivity rather than a client timer.
    for (const tid of providerIds) {
      const stat = await getStat(ctx, tid, category, "all");
      const pace = clamp(stat?.speedMs ?? 1000, 350, 1400);
      const startStagger = 200 + Math.random() * 500;
      let i = 0;
      for (const lead of leads) {
        const cellId = await ctx.db.insert("raceCells", {
          raceId,
          leadId: lead.id,
          toolId: tid,
          status: "pending",
        });
        const delay = startStagger + i * pace + Math.random() * pace * 0.4;
        await ctx.scheduler.runAfter(delay, internal.races.runCell, {
          cellId,
          useReal: args.useReal ?? false,
        });
        i++;
      }
    }

    return { raceId };
  },
});

// Resolve each lead's domain + LinkedIn (GPT-5.5 web search, cached) so the
// finders have a domain and Fiber has a LinkedIn URL — then run a real race.
export const createLiveRace = action({
  args: { name: v.optional(v.string()), leads: v.array(leadValidator) },
  handler: async (ctx, { name, leads }) => {
    const resolved = await Promise.all(
      leads.map(async (lead) => {
        if (lead.domain && lead.linkedin) return lead;
        const k = `resolve|${(lead.name ?? "").trim().toLowerCase()}|${(lead.company ?? "").trim().toLowerCase()}`;
        const cached = await ctx.runQuery(internal.races.getResolve, { key: k });
        let domain = lead.domain ?? cached?.domain ?? undefined;
        let linkedin = lead.linkedin ?? cached?.linkedin ?? undefined;
        if (!cached && (!domain || !linkedin)) {
          const r = await webSearchJSON(
            `Find the LinkedIn profile URL and company website domain for "${lead.name}" at company "${lead.company}". ` +
              `Return ONLY JSON: {"linkedinUrl":"https://www.linkedin.com/in/...","domain":"example.com"}. Use "" if genuinely unknown.`,
          );
          const rd = typeof r?.domain === "string" && r.domain ? r.domain : undefined;
          const rl = typeof r?.linkedinUrl === "string" && r.linkedinUrl ? r.linkedinUrl : undefined;
          domain = domain ?? rd;
          linkedin = linkedin ?? rl;
          await ctx.runMutation(internal.races.putResolve, { key: k, domain, linkedin });
        }
        return { ...lead, domain, linkedin };
      }),
    );

    return await ctx.runMutation(api.races.createRace, {
      name: name ?? "Live enrichment",
      providerSlugs: ["hunter", "prospeo", "people-data-labs", "fiber-ai"],
      leads: resolved,
      requestedFields: ["email", "title", "linkedin"],
      useReal: true,
    });
  },
});

export const getResolve = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const r = await ctx.db
      .query("resolutions")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return r ? { domain: r.domain, linkedin: r.linkedin } : null;
  },
});

export const putResolve = internalMutation({
  args: { key: v.string(), domain: v.optional(v.string()), linkedin: v.optional(v.string()) },
  handler: async (ctx, a) => {
    const e = await ctx.db
      .query("resolutions")
      .withIndex("by_key", (q) => q.eq("key", a.key))
      .unique();
    if (e) await ctx.db.patch(e._id, { domain: a.domain, linkedin: a.linkedin });
    else
      await ctx.db.insert("resolutions", {
        key: a.key,
        domain: a.domain,
        linkedin: a.linkedin,
        createdAt: Date.now(),
      });
  },
});

// Ingest REAL enrichment output (e.g. from an actual `npx orangeslice@latest`
// run or the Fiber AI API) as a graded race. Paste provider rows and they're
// scored against each other on the same objective grader as a simulated race.
export const ingestRace = mutation({
  args: {
    name: v.optional(v.string()),
    requestedFields: v.optional(v.array(v.string())),
    leads: v.array(leadValidator),
    results: v.array(
      v.object({
        providerSlug: v.string(),
        leadId: v.string(),
        fields: fieldsValidator,
        cost: v.optional(v.number()),
        latencyMs: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const requestedFields = args.requestedFields ?? DEFAULT_FIELDS;
    const slugToId: Record<string, Id<"tools">> = {};
    const providerIds: Id<"tools">[] = [];
    for (const slug of [...new Set(args.results.map((r) => r.providerSlug))]) {
      const t = await ctx.db
        .query("tools")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (t) {
        slugToId[slug] = t._id;
        providerIds.push(t._id);
      }
    }

    const raceId = await ctx.db.insert("races", {
      category: "enrichment",
      name: args.name ?? "Ingested real run",
      leads: args.leads,
      providerToolIds: providerIds,
      requestedFields,
      status: "running",
      createdAt: Date.now(),
    });

    for (const r of args.results) {
      const toolId = slugToId[r.providerSlug];
      if (!toolId) continue;
      const got = requestedFields.filter((f) => (r.fields as any)[f] != null).length;
      await ctx.db.insert("raceCells", {
        raceId,
        leadId: r.leadId,
        toolId,
        status: "filled",
        fields: r.fields,
        coverage: requestedFields.length ? got / requestedFields.length : 0,
        cost: r.cost ?? 0,
        latencyMs: r.latencyMs ?? 0,
        filledAt: Date.now(),
      });
    }

    const cells = await ctx.db
      .query("raceCells")
      .withIndex("by_race", (q) => q.eq("raceId", raceId))
      .collect();
    await ctx.db.patch(raceId, { status: "done" });
    const race = (await ctx.db.get(raceId))!;
    await applyRaceResult(ctx, race, cells);
    return { raceId };
  },
});

// ── live fill pipeline (internal) ───────────────────────────────────────────
export const cellContext = internalQuery({
  args: { cellId: v.id("raceCells") },
  handler: async (ctx, { cellId }) => {
    const cell = await ctx.db.get(cellId);
    if (!cell) return null;
    const race = await ctx.db.get(cell.raceId);
    if (!race) return null;
    const lead = race.leads.find((l) => l.id === cell.leadId) ?? { id: cell.leadId };
    const tool = await ctx.db.get(cell.toolId);
    const stat = await ctx.db
      .query("toolStats")
      .withIndex("by_cat_segment", (q) =>
        q.eq("category", "enrichment").eq("segment", "all"),
      )
      .filter((q) => q.eq(q.field("toolId"), cell.toolId))
      .unique();

    const coverage = stat?.coverage ?? 0.6;
    const validityBias = clamp(0.7 + (coverage - 0.6) * 0.6, 0.5, 0.97);
    const costPerValid = stat?.cost ?? 0.1;
    const profile: ProviderProfile = {
      slug: tool?.slug ?? "tool",
      coverageBias: coverage,
      validityBias,
      costPerRecord: costPerValid * validityBias,
      speedMs: stat?.speedMs ?? 1000,
    };
    return {
      lead: lead as Lead,
      requestedFields: race.requestedFields as RequestedField[],
      profile,
    };
  },
});

export const markRunning = internalMutation({
  args: { cellId: v.id("raceCells") },
  handler: async (ctx, { cellId }) => {
    const c = await ctx.db.get(cellId);
    if (c && c.status === "pending") await ctx.db.patch(cellId, { status: "running" });
  },
});

export const runCell = internalAction({
  args: { cellId: v.id("raceCells"), useReal: v.boolean() },
  handler: async (ctx, { cellId, useReal }) => {
    await ctx.runMutation(internal.races.markRunning, { cellId });
    const cxt = await ctx.runQuery(internal.races.cellContext, { cellId });
    if (!cxt) return;

    let result: EnrichResult | null = null;
    if (useReal) {
      // Cache real results per (provider, person) so re-runs don't re-burn credits.
      const key = `${cxt.profile.slug}|${(cxt.lead.name ?? "").trim().toLowerCase()}|${(cxt.lead.company ?? "").trim().toLowerCase()}`;
      const cached = await ctx.runQuery(internal.races.getCache, { key });
      if (cached) {
        result = { ...cached, source: "real" };
      } else {
        result = await realEnrich(cxt.profile, cxt.lead, cxt.requestedFields);
        // Real mode never falls back to the simulator — an empty result is honest.
        if (!result) result = { fields: {}, coverage: 0, cost: 0, latencyMs: 0, source: "real" };
        await ctx.runMutation(internal.races.putCache, {
          key,
          fields: result.fields,
          coverage: result.coverage,
          cost: result.cost,
          latencyMs: result.latencyMs,
        });
      }
    } else {
      result = simulateEnrich(cxt.profile, cxt.lead, cxt.requestedFields);
    }

    await ctx.runMutation(internal.races.commitCell, {
      cellId,
      fields: result.fields,
      coverage: result.coverage,
      cost: result.cost,
      latencyMs: result.latencyMs,
    });
  },
});

export const commitCell = internalMutation({
  args: {
    cellId: v.id("raceCells"),
    fields: fieldsValidator,
    coverage: v.number(),
    cost: v.number(),
    latencyMs: v.number(),
  },
  handler: async (ctx, a) => {
    const cell = await ctx.db.get(a.cellId);
    if (!cell) return;
    await ctx.db.patch(a.cellId, {
      status: "filled",
      fields: a.fields,
      coverage: a.coverage,
      cost: a.cost,
      latencyMs: a.latencyMs,
      filledAt: Date.now(),
    });

    // Flip the race to done once every cell has resolved, then grade it.
    const cells = await ctx.db
      .query("raceCells")
      .withIndex("by_race", (q) => q.eq("raceId", cell.raceId))
      .collect();
    const done = cells.every((c) => c.status === "filled" || c.status === "failed");
    if (done) {
      const race = await ctx.db.get(cell.raceId);
      if (race && race.status !== "done") {
        await ctx.db.patch(cell.raceId, { status: "done" });
        await applyRaceResult(ctx, race, cells);
      }
    }
  },
});

// ── real-result cache (so re-running the live race never re-burns credits) ──
export const getCache = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const c = await ctx.db
      .query("enrichCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return c
      ? { fields: c.fields, coverage: c.coverage, cost: c.cost, latencyMs: c.latencyMs }
      : null;
  },
});

export const putCache = internalMutation({
  args: {
    key: v.string(),
    fields: fieldsValidator,
    coverage: v.number(),
    cost: v.number(),
    latencyMs: v.number(),
  },
  handler: async (ctx, a) => {
    const existing = await ctx.db
      .query("enrichCache")
      .withIndex("by_key", (q) => q.eq("key", a.key))
      .unique();
    if (existing)
      await ctx.db.patch(existing._id, {
        fields: a.fields,
        coverage: a.coverage,
        cost: a.cost,
        latencyMs: a.latencyMs,
      });
    else await ctx.db.insert("enrichCache", { ...a, createdAt: Date.now() });
  },
});

// ── reads (frontend subscribes → sees the board tick live) ──────────────────
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export const getRace = query({
  args: { raceId: v.id("races") },
  handler: async (ctx, { raceId }) => {
    const race = await ctx.db.get(raceId);
    if (!race) return null;
    const cells = await ctx.db
      .query("raceCells")
      .withIndex("by_race", (q) => q.eq("raceId", raceId))
      .collect();

    const providers = await Promise.all(
      race.providerToolIds.map(async (tid) => {
        const t = await ctx.db.get(tid);
        const pc = cells.filter((c) => c.toolId === tid);
        const filled = pc.filter((c) => c.status === "filled");
        const valid = filled.filter((c) => c.fields?.emailValid).length;
        const totalCost = filled.reduce((s, c) => s + (c.cost ?? 0), 0);
        return {
          toolId: tid,
          slug: t?.slug,
          name: t?.name,
          logoText: t?.logoText,
          filled: filled.length,
          total: pc.length,
          running: pc.filter((c) => c.status === "running").length,
          emailValidity: filled.length ? valid / filled.length : 0,
          coverage: avg(filled.map((c) => c.coverage ?? 0)),
          costPerValid: valid ? totalCost / valid : null,
          avgLatencyMs: Math.round(avg(filled.map((c) => c.latencyMs ?? 0))),
          done: pc.length > 0 && pc.every((c) => c.status === "filled" || c.status === "failed"),
        };
      }),
    );

    return { race, cells, providers };
  },
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const running = await ctx.db
      .query("races")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .order("desc")
      .first();
    if (running) return running._id;
    const last = await ctx.db.query("races").order("desc").first();
    return last?._id ?? null;
  },
});
