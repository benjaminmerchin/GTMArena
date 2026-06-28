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

// ── real provider seam (configure keys in Convex env to enable) ─────────────

export async function realEnrich(
  p: ProviderProfile,
  lead: Lead,
  fields: RequestedField[],
): Promise<EnrichResult | null> {
  // Fiber AI GTM data API. Set FIBER_API_KEY in the Convex deployment env.
  // Endpoint shape is best-effort; falls back to the simulator on any miss.
  const fiberKey = process.env.FIBER_API_KEY;
  if (p.slug === "fiber-ai" && fiberKey) {
    try {
      const started = Date.now();
      const res = await fetch("https://api.fiber.ai/v1/enrich", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fiberKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: lead.name,
          company: lead.company,
          domain: lead.domain,
          fields,
        }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      const out: EnrichFields = {
        email: data.email ?? undefined,
        emailValid: data.email_status
          ? data.email_status === "valid"
          : data.email
            ? true
            : undefined,
        phone: data.phone ?? undefined,
        title: data.title ?? undefined,
        linkedin: data.linkedin_url ?? undefined,
      };
      const got = fields.filter((f) => (out as any)[f] != null).length;
      return {
        fields: out,
        coverage: fields.length ? got / fields.length : 0,
        cost: typeof data.cost === "number" ? data.cost : p.costPerRecord,
        latencyMs: Date.now() - started,
        source: "real",
      };
    } catch {
      return null;
    }
  }

  // Orange Slice is a Claude-Code toolkit (npx orangeslice@latest), driven at
  // build time rather than via a server HTTP API, so there's no runtime seam
  // here — its results are produced through the agent toolkit and ingested.
  return null;
}

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
