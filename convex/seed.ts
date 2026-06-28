import { mutation } from "./_generated/server";
import { Id, TableNames } from "./_generated/dataModel";

// ────────────────────────────────────────────────────────────────────────────
// Seed data — real low-level GTM tools across five categories.
//   convex run seed:run     (wipe + seed)
//   convex run seed:reset    (alias)
// ────────────────────────────────────────────────────────────────────────────

type Stat = {
  elo: number;
  cost: number;
  costUnit: string;
  ease: number; // 1-5
  speedMs: number;
  coverage?: number; // 0-1, enrichment only
};

type ToolSeed = {
  slug: string;
  name: string;
  url: string;
  logoText: string;
  blurb: string;
  categories: string[];
  segments: string[];
  pricingModel: "free" | "freemium" | "paid" | "usage";
  startingPriceUsd?: number;
  freeTier: boolean;
  auth: "api_key" | "oauth" | "none" | "token";
  openSource: boolean;
  docsQuality: number; // 1-5
  maintenance: "active" | "moderate" | "stale";
  productionReady: boolean;
  stats: Record<string, Stat>; // keyed by category
};

const CATEGORIES = [
  {
    key: "cold-email",
    name: "Cold Email",
    tagline: "Sequencers & sending infra that actually land in the inbox.",
    icon: "Mail",
    mode: "battle" as const,
    dimensions: ["quality", "affordability", "ease", "speed"],
    order: 1,
    enabled: true,
    blurb: "Multichannel sequencers, inbox rotation, and deliverability tooling.",
  },
  {
    key: "enrichment",
    name: "Enrichment",
    tagline: "Turn a name + company into a verified email, phone, and more.",
    icon: "Sparkles",
    mode: "race" as const,
    dimensions: ["quality", "affordability", "ease", "speed"],
    order: 2,
    enabled: true,
    blurb: "Waterfall enrichment, email finding & verification, firmographics.",
  },
  {
    key: "email-context",
    name: "Email Context",
    tagline: "Research & personalization signals that make outreach relevant.",
    icon: "Search",
    mode: "battle" as const,
    dimensions: ["quality", "ease", "affordability"],
    order: 3,
    enabled: true,
    blurb: "Prospect research, signal detection, and personalization at scale.",
  },
  {
    key: "parallel-dialer",
    name: "Parallel Dialer",
    tagline: "Dial many lines at once; talk to more humans per hour.",
    icon: "Phone",
    mode: "battle" as const,
    dimensions: ["quality", "affordability", "ease", "speed"],
    order: 4,
    enabled: false,
    blurb: "Power/parallel dialers that boost connect rates for SDR teams.",
  },
  {
    key: "scraping",
    name: "Scraping",
    tagline: "Pull clean, structured data from any page — at agent scale.",
    icon: "Globe",
    mode: "battle" as const,
    dimensions: ["quality", "affordability", "ease", "speed"],
    order: 5,
    enabled: true,
    blurb: "Crawlers, browser infra, and extraction APIs built for agents.",
  },
];

const SEGMENTS = [
  { key: "smb", label: "SMB", kind: "size" as const, order: 1 },
  { key: "mid", label: "Mid-Market", kind: "size" as const, order: 2 },
  { key: "ent", label: "Enterprise", kind: "size" as const, order: 3 },
  { key: "us", label: "US", kind: "geo" as const, order: 4 },
  { key: "eu", label: "EU", kind: "geo" as const, order: 5 },
  { key: "global", label: "Global", kind: "geo" as const, order: 6 },
];

// ── tools ───────────────────────────────────────────────────────────────────
const TOOLS: ToolSeed[] = [
  // ENRICHMENT ----------------------------------------------------------------
  {
    slug: "clay", name: "Clay", url: "https://clay.com", logoText: "CL",
    blurb: "Spreadsheet-native waterfall enrichment with 100+ data providers.",
    categories: ["enrichment", "email-context"], segments: ["mid", "ent", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 149, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1560, cost: 0.1, costUnit: "/valid", ease: 4.2, speedMs: 1600, coverage: 0.82 },
      "email-context": { elo: 1545, cost: 149, costUnit: "/mo", ease: 4.0, speedMs: 1600 },
    },
  },
  {
    slug: "orange-slice", name: "Orange Slice", url: "https://orangeslice.ai", logoText: "OS",
    blurb: "Agentic enrichment spreadsheet — every column is TypeScript the AI writes.",
    categories: ["enrichment", "email-context", "scraping"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 0, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1545, cost: 0.06, costUnit: "/valid", ease: 4.4, speedMs: 1100, coverage: 0.78 },
      "email-context": { elo: 1530, cost: 0, costUnit: "/mo", ease: 4.4, speedMs: 1100 },
      scraping: { elo: 1500, cost: 2, costUnit: "/1k pages", ease: 4.3, speedMs: 1400 },
    },
  },
  {
    slug: "apollo", name: "Apollo.io", url: "https://apollo.io", logoText: "AP",
    blurb: "B2B database + sequencing with bundled email & mobile enrichment.",
    categories: ["enrichment", "cold-email"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 49, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1530, cost: 0.04, costUnit: "/valid", ease: 4.5, speedMs: 900, coverage: 0.7 },
      "cold-email": { elo: 1480, cost: 49, costUnit: "/mo", ease: 4.2, speedMs: 1200 },
    },
  },
  {
    slug: "fiber-ai", name: "Fiber AI", url: "https://fiber.ai", logoText: "FB",
    blurb: "GTM data APIs + autonomous prospecting for AI-native pipelines.",
    categories: ["enrichment", "email-context"], segments: ["mid", "ent", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 0, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1525, cost: 0.08, costUnit: "/valid", ease: 4.1, speedMs: 1300, coverage: 0.8 },
      "email-context": { elo: 1520, cost: 0, costUnit: "/mo", ease: 4.0, speedMs: 1300 },
    },
  },
  {
    slug: "fullenrich", name: "FullEnrich", url: "https://fullenrich.com", logoText: "FE",
    blurb: "Waterfall email + mobile enrichment aggregating 15+ vendors.",
    categories: ["enrichment"], segments: ["mid", "ent", "eu", "global"],
    pricingModel: "usage", startingPriceUsd: 29, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1510, cost: 0.09, costUnit: "/valid", ease: 3.9, speedMs: 2000, coverage: 0.85 },
    },
  },
  {
    slug: "zoominfo", name: "ZoomInfo", url: "https://zoominfo.com", logoText: "ZI",
    blurb: "Enterprise-grade contact & intent data with deep firmographics.",
    categories: ["enrichment"], segments: ["ent", "us"],
    pricingModel: "paid", startingPriceUsd: 15000, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1515, cost: 0.25, costUnit: "/valid", ease: 3.8, speedMs: 1000, coverage: 0.88 },
    },
  },
  {
    slug: "people-data-labs", name: "People Data Labs", url: "https://peopledatalabs.com", logoText: "PD",
    blurb: "Raw person & company datasets over a clean enrichment API.",
    categories: ["enrichment"], segments: ["ent", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 98, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 5, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1505, cost: 0.07, costUnit: "/valid", ease: 3.6, speedMs: 1200, coverage: 0.75 },
    },
  },
  {
    slug: "prospeo", name: "Prospeo", url: "https://prospeo.io", logoText: "PR",
    blurb: "Fast, cheap email finder + verifier with LinkedIn support.",
    categories: ["enrichment"], segments: ["smb", "eu", "global"],
    pricingModel: "paid", startingPriceUsd: 39, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1500, cost: 0.03, costUnit: "/valid", ease: 4.0, speedMs: 800, coverage: 0.66 },
    },
  },
  {
    slug: "findymail", name: "Findymail", url: "https://findymail.com", logoText: "FM",
    blurb: "Verified B2B emails with a strong bounce guarantee.",
    categories: ["enrichment"], segments: ["smb", "mid", "us"],
    pricingModel: "paid", startingPriceUsd: 49, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1495, cost: 0.05, costUnit: "/valid", ease: 4.0, speedMs: 950, coverage: 0.7 },
    },
  },
  {
    slug: "clearbit", name: "Clearbit (Breeze)", url: "https://clearbit.com", logoText: "CB",
    blurb: "HubSpot-owned enrichment for real-time firmographics & reveal.",
    categories: ["enrichment"], segments: ["mid", "ent", "us"],
    pricingModel: "paid", startingPriceUsd: 12000, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "moderate", productionReady: true,
    stats: {
      enrichment: { elo: 1485, cost: 0.12, costUnit: "/valid", ease: 4.0, speedMs: 850, coverage: 0.72 },
    },
  },
  {
    slug: "hunter", name: "Hunter.io", url: "https://hunter.io", logoText: "HU",
    blurb: "Domain search & email finder with a generous free tier.",
    categories: ["enrichment"], segments: ["smb", "us", "eu", "global"],
    pricingModel: "freemium", startingPriceUsd: 34, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 5, maintenance: "active", productionReady: true,
    stats: {
      enrichment: { elo: 1470, cost: 0.04, costUnit: "/valid", ease: 4.3, speedMs: 700, coverage: 0.6 },
    },
  },
  {
    slug: "datagma", name: "Datagma", url: "https://datagma.com", logoText: "DG",
    blurb: "Enrichment & email finding with EU-friendly coverage.",
    categories: ["enrichment"], segments: ["eu", "global"],
    pricingModel: "paid", startingPriceUsd: 39, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "moderate", productionReady: true,
    stats: {
      enrichment: { elo: 1460, cost: 0.05, costUnit: "/valid", ease: 3.7, speedMs: 1100, coverage: 0.68 },
    },
  },

  // COLD EMAIL ----------------------------------------------------------------
  {
    slug: "instantly", name: "Instantly", url: "https://instantly.ai", logoText: "IN",
    blurb: "High-volume sending with unlimited inbox rotation & warmup.",
    categories: ["cold-email"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 37, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { "cold-email": { elo: 1545, cost: 37, costUnit: "/mo", ease: 4.6, speedMs: 700 } },
  },
  {
    slug: "smartlead", name: "Smartlead", url: "https://smartlead.ai", logoText: "SL",
    blurb: "Unlimited mailboxes, multivariate testing, and a deep API.",
    categories: ["cold-email"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 39, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { "cold-email": { elo: 1535, cost: 39, costUnit: "/mo", ease: 4.2, speedMs: 800 } },
  },
  {
    slug: "lemlist", name: "lemlist", url: "https://lemlist.com", logoText: "LM",
    blurb: "Personalization-first sequencing with images, video & liquid.",
    categories: ["cold-email", "email-context"], segments: ["smb", "mid", "eu", "global"],
    pricingModel: "paid", startingPriceUsd: 69, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: {
      "cold-email": { elo: 1500, cost: 69, costUnit: "/mo", ease: 4.4, speedMs: 1000 },
      "email-context": { elo: 1480, cost: 69, costUnit: "/mo", ease: 4.3, speedMs: 1100 },
    },
  },
  {
    slug: "salesforge", name: "Salesforge", url: "https://salesforge.ai", logoText: "SF",
    blurb: "AI-generated, per-prospect emails across rotating mailboxes.",
    categories: ["cold-email"], segments: ["smb", "mid", "global"],
    pricingModel: "paid", startingPriceUsd: 48, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "cold-email": { elo: 1490, cost: 48, costUnit: "/mo", ease: 4.0, speedMs: 950 } },
  },
  {
    slug: "quickmail", name: "QuickMail", url: "https://quickmail.com", logoText: "QM",
    blurb: "Reliable sequencing with deliverability analytics (AutoWarmer).",
    categories: ["cold-email"], segments: ["smb", "us"],
    pricingModel: "paid", startingPriceUsd: 49, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { "cold-email": { elo: 1470, cost: 49, costUnit: "/mo", ease: 4.1, speedMs: 1050 } },
  },
  {
    slug: "woodpecker", name: "Woodpecker", url: "https://woodpecker.co", logoText: "WP",
    blurb: "Deliverability-focused cold outreach for agencies & SMBs.",
    categories: ["cold-email"], segments: ["smb", "eu"],
    pricingModel: "paid", startingPriceUsd: 29, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "moderate", productionReady: true,
    stats: { "cold-email": { elo: 1465, cost: 29, costUnit: "/mo", ease: 4.0, speedMs: 1100 } },
  },

  // EMAIL CONTEXT -------------------------------------------------------------
  {
    slug: "unify", name: "Unify", url: "https://unifygtm.com", logoText: "UN",
    blurb: "Warm signals + agents that research and write personalized plays.",
    categories: ["email-context"], segments: ["mid", "ent", "us"],
    pricingModel: "paid", startingPriceUsd: 700, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "email-context": { elo: 1525, cost: 700, costUnit: "/mo", ease: 3.9, speedMs: 1500 } },
  },
  {
    slug: "persana", name: "Persana AI", url: "https://persana.ai", logoText: "PA",
    blurb: "AI prospecting + enrichment with trigger-based personalization.",
    categories: ["email-context", "enrichment"], segments: ["smb", "mid", "global"],
    pricingModel: "freemium", startingPriceUsd: 85, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: {
      "email-context": { elo: 1500, cost: 85, costUnit: "/mo", ease: 4.1, speedMs: 1400 },
      enrichment: { elo: 1475, cost: 0.07, costUnit: "/valid", ease: 4.0, speedMs: 1300, coverage: 0.69 },
    },
  },
  {
    slug: "octave", name: "Octave", url: "https://octavehq.com", logoText: "OC",
    blurb: "GTM 'playbook' engine: positioning-aware messaging per segment.",
    categories: ["email-context"], segments: ["mid", "ent", "us"],
    pricingModel: "paid", startingPriceUsd: 500, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "email-context": { elo: 1490, cost: 500, costUnit: "/mo", ease: 3.8, speedMs: 1500 } },
  },
  {
    slug: "lavender", name: "Lavender", url: "https://lavender.ai", logoText: "LV",
    blurb: "Real-time email coaching that scores and rewrites as you type.",
    categories: ["email-context"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 29, freeTier: true, auth: "oauth",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "email-context": { elo: 1470, cost: 29, costUnit: "/mo", ease: 4.5, speedMs: 600 } },
  },

  // PARALLEL DIALER (stub board) ----------------------------------------------
  {
    slug: "orum", name: "Orum", url: "https://orum.com", logoText: "OR",
    blurb: "AI parallel dialer with live conversation routing.",
    categories: ["parallel-dialer"], segments: ["mid", "ent", "us"],
    pricingModel: "paid", startingPriceUsd: 250, freeTier: false, auth: "oauth",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "parallel-dialer": { elo: 1540, cost: 250, costUnit: "/seat", ease: 4.2, speedMs: 1200 } },
  },
  {
    slug: "nooks", name: "Nooks", url: "https://nooks.in", logoText: "NK",
    blurb: "AI dialer + virtual salesfloor with call analytics.",
    categories: ["parallel-dialer"], segments: ["mid", "ent", "us"],
    pricingModel: "paid", startingPriceUsd: 200, freeTier: false, auth: "oauth",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "parallel-dialer": { elo: 1525, cost: 200, costUnit: "/seat", ease: 4.3, speedMs: 1150 } },
  },
  {
    slug: "koncert", name: "Koncert", url: "https://koncert.com", logoText: "KC",
    blurb: "Multi-line parallel dialer (AI Flow Dialer) for SDR teams.",
    categories: ["parallel-dialer"], segments: ["smb", "mid", "us"],
    pricingModel: "paid", startingPriceUsd: 79, freeTier: false, auth: "oauth",
    openSource: false, docsQuality: 3, maintenance: "moderate", productionReady: true,
    stats: { "parallel-dialer": { elo: 1495, cost: 79, costUnit: "/seat", ease: 3.8, speedMs: 1300 } },
  },
  {
    slug: "kixie", name: "Kixie", url: "https://kixie.com", logoText: "KX",
    blurb: "PowerCall dialer with CRM-native SMS + local presence.",
    categories: ["parallel-dialer"], segments: ["smb", "us"],
    pricingModel: "paid", startingPriceUsd: 35, freeTier: false, auth: "oauth",
    openSource: false, docsQuality: 3, maintenance: "active", productionReady: true,
    stats: { "parallel-dialer": { elo: 1470, cost: 35, costUnit: "/seat", ease: 4.0, speedMs: 1250 } },
  },

  // SCRAPING ------------------------------------------------------------------
  {
    slug: "firecrawl", name: "Firecrawl", url: "https://firecrawl.dev", logoText: "FC",
    blurb: "Turn any site into clean, LLM-ready markdown with one API call.",
    categories: ["scraping"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "freemium", startingPriceUsd: 16, freeTier: true, auth: "api_key",
    openSource: true, docsQuality: 5, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1560, cost: 1, costUnit: "/1k pages", ease: 4.6, speedMs: 1100 } },
  },
  {
    slug: "exa", name: "Exa", url: "https://exa.ai", logoText: "EX",
    blurb: "Neural search API that returns content agents can reason over.",
    categories: ["scraping"], segments: ["smb", "mid", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 0, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 5, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1535, cost: 2.5, costUnit: "/1k pages", ease: 4.5, speedMs: 900 } },
  },
  {
    slug: "browserbase", name: "Browserbase", url: "https://browserbase.com", logoText: "BB",
    blurb: "Headless browser infra for agents (Stagehand) at scale.",
    categories: ["scraping"], segments: ["mid", "ent", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 0, freeTier: true, auth: "api_key",
    openSource: true, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1520, cost: 4, costUnit: "/1k pages", ease: 4.2, speedMs: 1600 } },
  },
  {
    slug: "apify", name: "Apify", url: "https://apify.com", logoText: "AY",
    blurb: "Marketplace of 'Actors' + a platform to run any scraper.",
    categories: ["scraping"], segments: ["smb", "mid", "global"],
    pricingModel: "freemium", startingPriceUsd: 49, freeTier: true, auth: "api_key",
    openSource: true, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1500, cost: 3, costUnit: "/1k pages", ease: 3.9, speedMs: 1800 } },
  },
  {
    slug: "scrapingbee", name: "ScrapingBee", url: "https://scrapingbee.com", logoText: "SB",
    blurb: "Rendering + proxy rotation behind a single scraping endpoint.",
    categories: ["scraping"], segments: ["smb", "eu", "global"],
    pricingModel: "paid", startingPriceUsd: 49, freeTier: true, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1485, cost: 3.5, costUnit: "/1k pages", ease: 4.1, speedMs: 1500 } },
  },
  {
    slug: "brightdata", name: "Bright Data", url: "https://brightdata.com", logoText: "BD",
    blurb: "Enterprise proxy network + datasets for large-scale collection.",
    categories: ["scraping"], segments: ["ent", "us", "global"],
    pricingModel: "usage", startingPriceUsd: 0, freeTier: false, auth: "api_key",
    openSource: false, docsQuality: 4, maintenance: "active", productionReady: true,
    stats: { scraping: { elo: 1505, cost: 5, costUnit: "/1k pages", ease: 3.4, speedMs: 1400 } },
  },
];

// ── battle tasks + tool-specific sample outputs ─────────────────────────────
const BATTLE_TASKS = [
  {
    category: "cold-email",
    prompt:
      "Write a first-touch cold email to a VP of Sales at a 200-person B2B SaaS, pitching an AI SDR that books meetings. Under 75 words, one clear CTA.",
    context: "Persona: VP Sales · mid-market SaaS · cold, no prior relationship.",
  },
  {
    category: "cold-email",
    prompt:
      "Write a cold email to a law-firm Managing Partner offering an intake-automation tool that captures after-hours leads. Friendly, specific, under 80 words.",
    context: "Persona: Managing Partner · small law firm · values trust & specifics.",
  },
  {
    category: "email-context",
    prompt:
      "For a Head of Growth at a Series B fintech, produce 3 personalized cold-email opening lines grounded in plausible public signals (hiring, launches, funding).",
    context: "Goal: relevance from public signals, not generic flattery.",
  },
];

// taskIndex → [ [toolSlug, output], ... ]
const SAMPLES: Record<number, [string, string][]> = {
  0: [
    ["instantly",
      "Subject: 9 SDR hires worth of pipeline — without the 9 hires\n\nHi {{first}}, scaling a 200-person SaaS usually means hiring SDRs faster than you can ramp them. We run an AI SDR that books qualified meetings straight to your reps' calendars — clients see 15–20 added/month.\n\nWorth a 15-min look this week?"],
    ["smartlead",
      "Subject: quick question on {{company}}'s outbound\n\nHi {{first}} — are your SDRs spending more time researching than selling? Our AI SDR handles sourcing, personalization, and follow-up across rotating inboxes, then hands warm replies to your team.\n\nOpen to seeing a 2-min teardown of how it'd run on {{company}}?"],
    ["lemlist",
      "Subject: saw {{company}} is hiring 4 AEs 👀\n\nHi {{first}}, ramping AEs is expensive when pipeline is the real bottleneck. We deploy an AI SDR that books meetings on autopilot so your new hires walk into a full calendar, not a cold list.\n\nMind if I send a 60-sec Loom built for {{company}}?"],
    ["salesforge",
      "Subject: {{first}}, more meetings, same headcount\n\nMost VPs of Sales I talk to want pipeline without adding SDR salaries. Our AI writes and sends per-prospect emails at scale, then books the meeting. One client added 18 meetings/month in week 3.\n\nWant the breakdown?"],
    ["apollo",
      "Subject: 200 reps' worth of research, automated\n\nHi {{first}}, pulled {{company}} from our 275M-contact DB — your ICP looks like a fit. Our AI SDR enriches, sequences, and books meetings end-to-end so reps only see warm calendars.\n\nGrab 15 minutes Thursday?"],
  ],
  1: [
    ["instantly",
      "Subject: after-hours leads at {{company}}?\n\nHi {{first}}, most firms lose the callers who reach out at 9pm. Our intake tool answers instantly, qualifies, and books the consult — so tomorrow's calendar fills itself.\n\nWorth a quick look?"],
    ["lemlist",
      "Subject: the 7pm caller you never hear from\n\nHi {{first}}, after-hours injury & family-law leads rarely wait until morning — they call the next firm. We capture, qualify, and schedule them automatically, even at midnight.\n\nCan I show you what {{company}} missed last week?"],
    ["smartlead",
      "Subject: never miss an intake again\n\nHi {{first}} — when a prospective client reaches out after hours, our tool runs your intake script, collects case details, and books the consult. Partners wake up to qualified appointments.\n\nOpen to a 10-min walkthrough?"],
    ["woodpecker",
      "Subject: a question about {{company}}'s intake\n\nHi {{first}}, how do you handle leads that come in nights & weekends? We automate intake so none slip through — capture, qualify, schedule. Firms recover 20–30% more consults.\n\nWould a short demo be useful?"],
    ["quickmail",
      "Subject: turn missed calls into booked consults\n\nHi {{first}}, after-hours inquiries are where firms quietly lose cases. Our intake automation responds in seconds, qualifies the matter, and books the meeting on your calendar.\n\nCan I send a 2-min example?"],
  ],
  2: [
    ["clay",
      "1) 'Congrats on the Series B — saw the TechCrunch piece. New funding usually means new fraud surface; how are you thinking about underwriting risk as you scale?'\n2) 'Noticed you're hiring 3 risk analysts — building the function in-house or augmenting with tooling first?'\n3) 'You shipped instant payouts last month — curious how that changed your chargeback exposure.'"],
    ["unify",
      "1) 'Your pricing page now shows an Enterprise tier — moving upmarket changes the buyer; is GTM following?'\n2) 'Saw 4 open Growth roles on {{company}}'s careers page — scaling the team or the playbook?'\n3) 'Your CEO's last post called CAC 'the silent killer' — that's exactly the wedge we help with.'"],
    ["persana",
      "1) 'Caught your Series B news — congrats! Fintechs at your stage usually hit an activation wall around now.'\n2) 'You just launched a developer API — are self-serve signups outpacing your onboarding?'\n3) 'Noticed {{company}} joined the Visa fintech program — compliance load about to spike?'"],
    ["octave",
      "1) 'For a Series B fintech, the bottleneck is rarely leads — it's converting them before compliance slows the funnel. Here's how we shorten that.'\n2) 'Your ICP just shifted from SMB to mid-market — does your messaging still land with the new buyer?'\n3) 'Scaling Growth without a positioning system usually means each rep improvising. We fix that.'"],
  ],
};

// ── seeding ─────────────────────────────────────────────────────────────────
function h(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}

const WIPE_TABLES: TableNames[] = [
  "categories", "segments", "tools", "toolStats", "battleTasks",
  "samples", "battles", "votes", "races", "raceCells", "submissions",
];

async function seedAll(ctx: any) {
  // wipe
  for (const table of WIPE_TABLES) {
    const docs = await ctx.db.query(table).collect();
    for (const d of docs) await ctx.db.delete(d._id);
  }

  for (const c of CATEGORIES) await ctx.db.insert("categories", c as any);
  for (const s of SEGMENTS) await ctx.db.insert("segments", s);

  const slugToId: Record<string, Id<"tools">> = {};
  for (const t of TOOLS) {
    const { stats, ...tool } = t;
    const id = await ctx.db.insert("tools", tool);
    slugToId[t.slug] = id;

    for (const [category, st] of Object.entries(stats)) {
      // overall board
      await ctx.db.insert("toolStats", {
        toolId: id, category, segment: "all",
        elo: st.elo, wins: 0, losses: 0, ties: 0, battles: 0, winRate: 0,
        cost: st.cost, costUnit: st.costUnit, easeScore: st.ease,
        speedMs: st.speedMs, coverage: st.coverage,
      });
      // segment boards the tool targets (deterministic Elo offset so they reorder)
      for (const seg of t.segments) {
        const offset = (h(`${t.slug}|${category}|${seg}`) % 80) - 40;
        await ctx.db.insert("toolStats", {
          toolId: id, category, segment: seg,
          elo: st.elo + offset, wins: 0, losses: 0, ties: 0, battles: 0, winRate: 0,
          cost: st.cost, costUnit: st.costUnit, easeScore: st.ease,
          speedMs: st.speedMs, coverage: st.coverage,
        });
      }
    }
  }

  const taskIds: Id<"battleTasks">[] = [];
  for (const task of BATTLE_TASKS) {
    taskIds.push(await ctx.db.insert("battleTasks", task));
  }
  for (const [idxStr, pairs] of Object.entries(SAMPLES)) {
    const idx = Number(idxStr);
    const taskId = taskIds[idx];
    const category = BATTLE_TASKS[idx].category;
    for (const [slug, output] of pairs) {
      const toolId = slugToId[slug];
      if (!toolId) continue;
      await ctx.db.insert("samples", { category, taskId, toolId, output });
    }
  }

  return {
    categories: CATEGORIES.length,
    segments: SEGMENTS.length,
    tools: TOOLS.length,
    battleTasks: BATTLE_TASKS.length,
    samples: Object.values(SAMPLES).reduce((n, p) => n + p.length, 0),
  };
}

export const run = mutation({ args: {}, handler: async (ctx) => await seedAll(ctx) });
export const reset = mutation({ args: {}, handler: async (ctx) => await seedAll(ctx) });
