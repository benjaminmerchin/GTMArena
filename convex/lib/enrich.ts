// Enrichment provider layer for the RACE (Enrichment Arena).
//
// Two paths:
//   • realEnrich  — seam for live providers (Fiber AI GTM API, etc.). Returns
//                   null unless a key/endpoint is configured, so the demo never
//                   blocks on credentials.
//   • simulateEnrich — deterministic, provider-flavoured fake enrichment so the
//                   race runs offline and *feels* live. Each provider's coverage,
//                   email validity, cost and speed reflect its seeded character.

export type RequestedField = "email" | "phone" | "title" | "linkedin";

export type Lead = {
  id: string;
  name?: string;
  company?: string;
  domain?: string;
  title?: string;
  linkedin?: string;
  email?: string;
};

export type EnrichFields = {
  email?: string;
  emailValid?: boolean;
  phone?: string;
  title?: string;
  linkedin?: string;
};

export type EnrichResult = {
  fields: EnrichFields;
  coverage: number; // 0-1 of requestedFields filled
  cost: number; // $ for this record
  latencyMs: number;
  source: "real" | "sim";
};

export type ProviderProfile = {
  slug: string;
  coverageBias: number; // ~typical coverage 0-1
  validityBias: number; // ~typical email validity 0-1
  costPerRecord: number; // $ per attempted record
  speedMs: number;
};

// ── deterministic pseudo-random from a string seed ──────────────────────────

function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(...parts: string[]): number {
  return (hashInt(parts.join("|")) % 100000) / 100000;
}

function slugifyName(name: string): { first: string; last: string } {
  const clean = name.trim().toLowerCase().replace(/[^a-z\s]/g, "");
  const parts = clean.split(/\s+/);
  return { first: parts[0] || "alex", last: parts[parts.length - 1] || "doe" };
}

function domainFor(lead: Lead): string {
  if (lead.domain) return lead.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (lead.company) {
    return lead.company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18) + ".com";
  }
  return "example.com";
}

function fakePhone(seed: string): string {
  const n = hashInt(seed);
  const area = 200 + (n % 800);
  const mid = 200 + ((n >>> 7) % 800);
  const last = (n >>> 13) % 10000;
  return `+1 (${area}) ${mid}-${String(last).padStart(4, "0")}`;
}

// ── simulator ───────────────────────────────────────────────────────────────

export function simulateEnrich(
  p: ProviderProfile,
  lead: Lead,
  fields: RequestedField[],
): EnrichResult {
  const out: EnrichFields = {};
  const { first, last } = slugifyName(lead.name ?? "Alex Doe");
  const domain = domainFor(lead);
  let got = 0;

  for (const f of fields) {
    const r = rand(p.slug, lead.id, f);
    switch (f) {
      case "email":
        if (r < p.coverageBias) {
          out.email = `${first}.${last}@${domain}`;
          out.emailValid = rand(p.slug, lead.id, "valid") < p.validityBias;
          got++;
        }
        break;
      case "phone":
        if (r < p.coverageBias * 0.8) {
          out.phone = fakePhone(`${p.slug}${lead.id}`);
          got++;
        }
        break;
      case "title":
        if (r < Math.min(1, p.coverageBias * 1.1)) {
          out.title = lead.title ?? "VP Operations";
          got++;
        }
        break;
      case "linkedin":
        if (r < p.coverageBias * 0.9) {
          out.linkedin = `linkedin.com/in/${first}-${last}`;
          got++;
        }
        break;
    }
  }

  const coverage = fields.length ? got / fields.length : 0;
  const latencyJitter = 0.7 + rand(p.slug, lead.id, "lat") * 0.6;
  return {
    fields: out,
    coverage,
    cost: Math.round(p.costPerRecord * 10000) / 10000,
    latencyMs: Math.round(p.speedMs * latencyJitter),
    source: "sim",
  };
}

// ── real providers (live APIs; keys set in the Convex deployment env) ───────

function splitName(name?: string): { first: string; last: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    last: parts.length > 1 ? parts.slice(1).join(" ") : (parts[0] ?? ""),
  };
}

function pack(
  out: EnrichFields,
  fields: RequestedField[],
  cost: number,
  started: number,
): EnrichResult {
  const got = fields.filter((f) => (out as any)[f] != null).length;
  return {
    fields: out,
    coverage: fields.length ? got / fields.length : 0,
    cost,
    latencyMs: Date.now() - started,
    source: "real",
  };
}

// Hunter — email-finder (returns email + confidence score + title + LinkedIn).
async function hunterEnrich(lead: Lead, fields: RequestedField[]): Promise<EnrichResult> {
  const key = process.env.HUNTER_API_KEY;
  const started = Date.now();
  const out: EnrichFields = {};
  const { first, last } = splitName(lead.name);
  if (key && first && last) {
    try {
      const q = new URLSearchParams({ first_name: first, last_name: last, api_key: key });
      if (lead.domain) q.set("domain", lead.domain);
      else if (lead.company) q.set("company", lead.company);
      const res = await fetch(`https://api.hunter.io/v2/email-finder?${q}`);
      if (res.ok) {
        const x: any = (await res.json())?.data ?? {};
        if (x.email) {
          out.email = x.email;
          out.emailValid = x.score != null ? x.score >= 80 : x.verification?.status === "valid";
        }
        if (x.position) out.title = x.position;
        if (x.linkedin_url) out.linkedin = x.linkedin_url;
      } else console.error("[hunter]", res.status, await res.text());
    } catch (e) {
      console.error("[hunter]", e);
    }
  }
  return pack(out, fields, 0.02, started);
}

// Prospeo — enrich-person (verified work email + title + LinkedIn).
async function prospeoEnrich(lead: Lead, fields: RequestedField[]): Promise<EnrichResult> {
  const key = process.env.PROSPEO_API_KEY;
  const started = Date.now();
  const out: EnrichFields = {};
  const { first, last } = splitName(lead.name);
  if (key && first && last && (lead.company || lead.domain)) {
    try {
      const company = lead.domain
        ? { company_website: lead.domain }
        : { company_name: lead.company };
      const res = await fetch("https://api.prospeo.io/enrich-person", {
        method: "POST",
        headers: { "X-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ data: { first_name: first, last_name: last, ...company } }),
      });
      const data: any = await res.json();
      if (!data.error && data.person) {
        const em = data.person.email ?? {};
        if (em.email) {
          out.email = em.email;
          out.emailValid = em.status === "VERIFIED" || em.status === "VALID";
        }
        if (data.person.job_title) out.title = data.person.job_title;
        if (data.person.linkedin_url) out.linkedin = data.person.linkedin_url;
      }
    } catch (e) {
      console.error("[prospeo]", e);
    }
  }
  return pack(out, fields, 0.03, started);
}

// People Data Labs — person enrich (title + LinkedIn; work email on paid plans).
async function pdlEnrich(lead: Lead, fields: RequestedField[]): Promise<EnrichResult> {
  const key = process.env.PDL_API_KEY;
  const started = Date.now();
  const out: EnrichFields = {};
  const { first, last } = splitName(lead.name);
  if (key && first && last && (lead.company || lead.domain)) {
    try {
      const q = new URLSearchParams({
        first_name: first,
        last_name: last,
        company: lead.domain ?? lead.company ?? "",
        min_likelihood: "2",
        api_key: key,
      });
      const res = await fetch(`https://api.peopledatalabs.com/v5/person/enrich?${q}`);
      const data: any = await res.json();
      if (data.status === 200) {
        const x = data.data ?? {};
        if (typeof x.work_email === "string") {
          out.email = x.work_email;
          out.emailValid = true;
        }
        if (x.job_title) out.title = x.job_title;
        if (x.linkedin_url)
          out.linkedin = x.linkedin_url.startsWith("http") ? x.linkedin_url : `https://${x.linkedin_url}`;
      }
    } catch (e) {
      console.error("[pdl]", e);
    }
  }
  return pack(out, fields, 0.01, started);
}

// Fiber AI — turbo-enrich (best-effort; identifier = LinkedIn / email / domain).
async function fiberEnrich(lead: Lead, fields: RequestedField[]): Promise<EnrichResult> {
  const key = process.env.FIBER_API_KEY;
  const started = Date.now();
  const out: EnrichFields = {};
  const identifier = lead.linkedin ?? lead.email ?? lead.domain ?? lead.company;
  if (key && identifier) {
    try {
      const res = await fetch("https://api.fiber.ai/v1/contacts/turbo-enrich", {
        method: "POST",
        headers: { "x-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          linkedinUrl: lead.linkedin,
          email: lead.email,
          domain: lead.domain,
          name: lead.name,
          company: lead.company,
        }),
      });
      if (res.ok) {
        const data: any = await res.json();
        const c = data.contact ?? data.data ?? data ?? {};
        if (c.email) {
          out.email = c.email;
          out.emailValid =
            c.emailValidity === true || c.emailValidity === "valid" || c.emailStatus === "valid";
        }
        if (c.title) out.title = c.title;
        if (c.linkedinUrl ?? c.linkedin) out.linkedin = c.linkedinUrl ?? c.linkedin;
      } else console.error("[fiber]", res.status, await res.text());
    } catch (e) {
      console.error("[fiber]", e);
    }
  }
  return pack(out, fields, 0.04, started);
}

// Dispatch to the live provider by slug. Returns null for tools with no real
// adapter (the caller then knows there's no real data for that provider).
export async function realEnrich(
  p: ProviderProfile,
  lead: Lead,
  fields: RequestedField[],
): Promise<EnrichResult | null> {
  switch (p.slug) {
    case "hunter":
      return hunterEnrich(lead, fields);
    case "prospeo":
      return prospeoEnrich(lead, fields);
    case "people-data-labs":
      return pdlEnrich(lead, fields);
    case "fiber-ai":
      return fiberEnrich(lead, fields);
    default:
      return null;
  }
}

// The four providers wired for the live race.
export const REAL_PROVIDERS = ["hunter", "prospeo", "people-data-labs", "fiber-ai"];

// A built-in law-firm lead list for the demo race (per the kernel brief).
export const DEFAULT_LEADS: Lead[] = [
  { id: "l1", name: "Marcus Reed", company: "Reed & Castellano LLP", domain: "reedcastellano.com", title: "Managing Partner" },
  { id: "l2", name: "Priya Nair", company: "Nair Immigration Law", domain: "nairimmigration.com", title: "Principal Attorney" },
  { id: "l3", name: "David Okafor", company: "Okafor Trial Group", domain: "okafortrial.com", title: "Founding Partner" },
  { id: "l4", name: "Sofia Marchetti", company: "Marchetti & Vance", domain: "marchettivance.com", title: "Partner" },
  { id: "l5", name: "James Whitlock", company: "Whitlock Estate Law", domain: "whitlockestate.com", title: "Of Counsel" },
  { id: "l6", name: "Aisha Rahman", company: "Rahman Family Law", domain: "rahmanfamilylaw.com", title: "Senior Associate" },
  { id: "l7", name: "Thomas Byrne", company: "Byrne & Associates", domain: "byrnelegal.com", title: "Managing Partner" },
  { id: "l8", name: "Elena Vasquez", company: "Vasquez Injury Attorneys", domain: "vasquezinjury.com", title: "Lead Counsel" },
  { id: "l9", name: "Robert Kim", company: "Kim Corporate Counsel", domain: "kimcorporate.com", title: "Partner" },
  { id: "l10", name: "Hannah Goldberg", company: "Goldberg IP Law", domain: "goldbergip.com", title: "Patent Attorney" },
  { id: "l11", name: "Daniel Mensah", company: "Mensah Defense Group", domain: "mensahdefense.com", title: "Founding Attorney" },
  { id: "l12", name: "Clara Jensen", company: "Jensen Employment Law", domain: "jensenemployment.com", title: "Principal" },
];
