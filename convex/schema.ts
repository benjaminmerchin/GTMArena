import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ────────────────────────────────────────────────────────────────────────────
// GTM Arena — schema
//
// A crowdsourced leaderboard that benchmarks low-level GTM tools by category.
// Two modes:
//   • BATTLE — blind A/B vote → Elo / win-rate ranking (LMArena logic)
//   • RACE   — live parallel enrichment bake-off + objective grader (Design Arena)
//
// Every leaderboard can sort by up to four dimensions (a category picks a subset):
//   quality (Elo/win-rate ↑) · affordability (cost ↓) · ease (1-5 ↑) · speed (ms ↓)
// ────────────────────────────────────────────────────────────────────────────

// The four ranking dimensions. A category exposes a subset (max 4) of these.
export const dimension = v.union(
  v.literal("quality"),       // Elo / win-rate — higher is better
  v.literal("affordability"), // cost per unit — lower is better
  v.literal("ease"),          // ease of use, 1-5 — higher is better
  v.literal("speed"),         // latency in ms — lower is better
);

const battleResult = v.union(
  v.literal("A"),
  v.literal("B"),
  v.literal("tie"),
  v.literal("bothBad"),
);

export default defineSchema({
  // Low-level GTM tool categories. Each is its own sub-arena.
  categories: defineTable({
    key: v.string(),                    // slug, e.g. "cold-email"
    name: v.string(),                   // "Cold Email"
    tagline: v.string(),                // one-liner for the hub card
    icon: v.string(),                   // lucide icon name (kept neutral)
    mode: v.union(v.literal("battle"), v.literal("race")),
    dimensions: v.array(dimension),     // which sort toggles this category shows
    order: v.number(),
    enabled: v.boolean(),               // v1 fully built vs. stubbed leaderboard
    blurb: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_order", ["order"]),

  // Vertical / geo / size segments for leaderboard filtering.
  segments: defineTable({
    key: v.string(),                    // "smb", "ent", "us", "eu"
    label: v.string(),                  // "SMB", "Enterprise", "US", "EU"
    kind: v.union(v.literal("vertical"), v.literal("geo"), v.literal("size")),
    order: v.number(),
  }).index("by_key", ["key"]),

  // The contestants — the rich "directory" record for each tool.
  tools: defineTable({
    slug: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    logoText: v.optional(v.string()),   // monogram fallback for the frontend
    blurb: v.string(),
    categories: v.array(v.string()),    // category keys this tool competes in
    segments: v.array(v.string()),      // segment keys this tool targets
    pricingModel: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
      v.literal("usage"),
    ),
    startingPriceUsd: v.optional(v.number()),
    freeTier: v.boolean(),
    auth: v.union(
      v.literal("api_key"),
      v.literal("oauth"),
      v.literal("none"),
      v.literal("token"),
    ),
    openSource: v.boolean(),
    docsQuality: v.number(),            // 1-5
    maintenance: v.union(
      v.literal("active"),
      v.literal("moderate"),
      v.literal("stale"),
    ),
    productionReady: v.boolean(),
  }).index("by_slug", ["slug"]),

  // Competitive stats per (tool, category, segment). segment "all" = overall.
  // Leaderboards read this; battles/races write it.
  toolStats: defineTable({
    toolId: v.id("tools"),
    category: v.string(),
    segment: v.string(),                // "all" or a segment key
    elo: v.number(),                    // quality
    wins: v.number(),
    losses: v.number(),
    ties: v.number(),
    battles: v.number(),
    winRate: v.number(),                // 0-1
    cost: v.number(),                   // affordability — lower is better
    costUnit: v.string(),               // "/valid", "/1k emails", "/seat/mo"
    easeScore: v.number(),              // 1-5
    speedMs: v.number(),                // lower is better
    coverage: v.optional(v.number()),   // 0-1 (enrichment field-fill rate)
  })
    .index("by_cat_segment", ["category", "segment"])
    .index("by_tool", ["toolId"]),

  // ── BATTLE mode ───────────────────────────────────────────────────────────

  // Shared task prompts shown at the top of a battle.
  battleTasks: defineTable({
    category: v.string(),
    prompt: v.string(),
    context: v.optional(v.string()),
  }).index("by_category", ["category"]),

  // Pre-written, tool-specific outputs that make a blind battle real offline.
  samples: defineTable({
    category: v.string(),
    taskId: v.id("battleTasks"),
    toolId: v.id("tools"),
    output: v.string(),
  })
    .index("by_task", ["taskId"])
    .index("by_tool", ["toolId"]),

  // A blind battle instance: two anonymized outputs → vote → reveal.
  battles: defineTable({
    category: v.string(),
    taskId: v.id("battleTasks"),
    task: v.string(),
    contestants: v.array(
      v.object({
        label: v.string(),              // "A" / "B"
        toolId: v.id("tools"),
        output: v.string(),
      }),
    ),
    status: v.union(v.literal("open"), v.literal("voted")),
    result: v.optional(battleResult),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  // Every vote — human or LLM judge (designarena.ai-style dual ranking).
  votes: defineTable({
    battleId: v.id("battles"),
    category: v.string(),
    result: battleResult,
    voterId: v.optional(v.string()),    // auth subject or anonymous session
    judgeType: v.union(v.literal("human"), v.literal("llm")),
    judgeModel: v.optional(v.string()), // e.g. "gpt-4o-mini" when judgeType=llm
    createdAt: v.number(),
  })
    .index("by_battle", ["battleId"])
    .index("by_voter", ["voterId"]),

  // ── RACE mode (Enrichment Arena) ──────────────────────────────────────────

  races: defineTable({
    category: v.string(),               // "enrichment"
    name: v.string(),
    leads: v.array(
      v.object({
        id: v.string(),
        name: v.optional(v.string()),
        company: v.optional(v.string()),
        domain: v.optional(v.string()),
        title: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        email: v.optional(v.string()),
      }),
    ),
    providerToolIds: v.array(v.id("tools")),
    requestedFields: v.array(v.string()), // ["email","phone","title","linkedin"]
    status: v.union(v.literal("running"), v.literal("done")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  // One cell per (race, lead, provider) — fills in over time to feel live.
  raceCells: defineTable({
    raceId: v.id("races"),
    leadId: v.string(),
    toolId: v.id("tools"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("filled"),
      v.literal("failed"),
    ),
    fields: v.optional(
      v.object({
        email: v.optional(v.string()),
        emailValid: v.optional(v.boolean()),
        phone: v.optional(v.string()),
        title: v.optional(v.string()),
        linkedin: v.optional(v.string()),
      }),
    ),
    coverage: v.optional(v.number()),   // 0-1 of requestedFields filled
    cost: v.optional(v.number()),       // $ for this record
    latencyMs: v.optional(v.number()),
    filledAt: v.optional(v.number()),
  })
    .index("by_race", ["raceId"])
    .index("by_race_tool", ["raceId", "toolId"])
    .index("by_race_lead", ["raceId", "leadId"]),

  // ── Community ─────────────────────────────────────────────────────────────

  // "Product Hunt for agent tools" — anyone can submit a tool for review.
  submissions: defineTable({
    name: v.string(),
    url: v.optional(v.string()),
    category: v.string(),
    note: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // LLM-generated ranking of the tools in a category (the curation layer).
  // We ask OpenAI to rank, store the ordered result, and recommendations read
  // from the latest stored ranking.
  rankings: defineTable({
    category: v.string(),
    model: v.string(), // e.g. "gpt-4o" / "gpt-5.5"
    createdAt: v.number(),
    entries: v.array(
      v.object({
        toolId: v.id("tools"),
        rank: v.number(),
        score: v.number(), // overall 0-100
        scores: v.object({
          quality: v.optional(v.number()),
          affordability: v.optional(v.number()),
          ease: v.optional(v.number()),
          speed: v.optional(v.number()),
        }),
        rationale: v.string(),
      }),
    ),
  }).index("by_category", ["category"]),

  // Lightweight accounts (passwordless email; votes/submissions attach here).
  users: defineTable({
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // One-time magic-link tokens emailed via Resend.
  magicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // Rich "wiki" profile per tool, researched live by GPT-5.5 web search.
  toolProfiles: defineTable({
    slug: v.string(),
    summary: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    logoDomain: v.optional(v.string()),
    bestFor: v.optional(v.string()),
    differentiators: v.array(v.string()),
    pricing: v.array(
      v.object({ tier: v.string(), price: v.string(), notes: v.optional(v.string()) }),
    ),
    freeTier: v.optional(v.boolean()),
    pricingNotes: v.optional(v.string()),
    features: v.array(v.string()),
    integrations: v.array(v.string()),
    apiAvailable: v.optional(v.boolean()),
    pros: v.array(v.string()),
    cons: v.array(v.string()),
    alternatives: v.array(v.string()),
    company: v.object({
      founded: v.optional(v.string()),
      hq: v.optional(v.string()),
      teamSize: v.optional(v.string()),
      funding: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
    }),
    sources: v.array(v.object({ title: v.string(), url: v.string() })),
    model: v.string(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Cache of real provider results per (provider, person) so re-running the live
  // race never re-burns API credits.
  enrichCache: defineTable({
    key: v.string(), // `${slug}|${name}|${company}`
    fields: v.object({
      email: v.optional(v.string()),
      emailValid: v.optional(v.boolean()),
      phone: v.optional(v.string()),
      title: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    }),
    coverage: v.number(),
    cost: v.number(),
    latencyMs: v.number(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),
});
