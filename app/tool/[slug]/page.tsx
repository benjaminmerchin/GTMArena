"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fmtCost, fmtSpeed } from "@/lib/ui";
import { Check, X, Calendar, MapPin, Users, Banknote, ExternalLink } from "lucide-react";

function domainOf(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export default function ToolProfile() {
  const slug = String(useParams().slug);
  const base = useQuery(api.tools.getProfile, { slug });
  const wiki = useQuery(api.research.getProfile, { slug });

  if (base === undefined)
    return <div className="mx-auto max-w-5xl px-6 py-10 text-ink/40 lg:px-10">Loading…</div>;
  if (base === null)
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-ink/40 lg:px-10">Tool not found.</div>
    );

  const { tool, badges } = base;
  const domain = wiki?.logoDomain || domainOf(tool.url);
  const website = wiki?.website || tool.url;
  const company = wiki?.company;
  const hasCompany =
    company && (company.founded || company.hq || company.teamSize || company.funding);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        ← Hub
      </Link>

      {/* header */}
      <div className="mt-5 flex flex-wrap items-start gap-5">
        {domain ? (
          <img
            src={`https://logo.clearbit.com/${domain}`}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            }}
            className="h-16 w-16 shrink-0 rounded-2xl border border-line bg-white object-contain p-2"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-line bg-ink/5 text-lg font-semibold text-ink/80">
            {tool.logoText}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-semibold text-ink">{tool.name}</h1>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {domain} <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-ink/65">{wiki?.summary ?? tool.blurb}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Tag>{tool.pricingModel}</Tag>
            {(wiki?.freeTier ?? tool.freeTier) && <Tag accent>free tier</Tag>}
            <Tag>{tool.openSource ? "open source" : "closed source"}</Tag>
            {(wiki?.apiAvailable ?? tool.auth !== "none") && <Tag>API</Tag>}
            <Tag>docs {tool.docsQuality}/5</Tag>
          </div>
        </div>
      </div>

      {/* company facts */}
      {hasCompany && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {company!.founded && <Fact icon={<Calendar size={15} />} k="Founded" v={company!.founded} />}
          {company!.hq && <Fact icon={<MapPin size={15} />} k="HQ" v={company!.hq} />}
          {company!.teamSize && <Fact icon={<Users size={15} />} k="Team" v={company!.teamSize} />}
          {company!.funding && <Fact icon={<Banknote size={15} />} k="Funding" v={company!.funding} />}
        </div>
      )}

      {/* rank badges */}
      {badges.length > 0 && (
        <>
          <H>Rankings across categories</H>
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((b: any) => (
              <Link key={b.category} href={`/c/${b.category}`} className="surface surface-hover p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{b.categoryName}</span>
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent">
                    #{b.rank} <span className="font-normal text-ink/35">/ {b.of}</span>
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
                  <Stat k="Elo" v={String(b.elo)} />
                  <Stat k="Cost" v={fmtCost(b.cost, b.costUnit)} />
                  <Stat k="Ease" v={b.easeScore.toFixed(1)} />
                  <Stat k="Speed" v={fmtSpeed(b.speedMs)} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {wiki === undefined && (
        <p className="mt-8 text-sm text-ink/40">Loading profile…</p>
      )}
      {wiki === null && (
        <p className="mt-8 rounded-xl border border-line bg-ink/[0.03] p-4 text-sm text-ink/45">
          A live GPT-5.5 profile for this tool is being researched — check back shortly.
        </p>
      )}

      {wiki && (
        <>
          {wiki.description && (
            <>
              <H>Overview</H>
              <p className="text-ink/70 leading-relaxed">{wiki.description}</p>
            </>
          )}

          {(wiki.bestFor || wiki.differentiators?.length > 0) && (
            <>
              <H>At a glance</H>
              {wiki.bestFor && (
                <p className="text-ink/70">
                  <span className="font-medium text-ink">Best for: </span>
                  {wiki.bestFor}
                </p>
              )}
              {wiki.differentiators?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {wiki.differentiators.map((d: string, i: number) => (
                    <span key={i} className="chip px-3 py-1.5 text-sm text-ink/70">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {wiki.pricing?.length > 0 && (
            <>
              <H>Pricing</H>
              <div className="surface overflow-hidden">
                {wiki.pricing.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-ink">{p.tier}</span>
                      {p.notes && <span className="ml-2 text-xs text-ink/45">{p.notes}</span>}
                    </div>
                    <span className="font-semibold tabular-nums text-accent">{p.price}</span>
                  </div>
                ))}
              </div>
              {wiki.pricingNotes && (
                <p className="mt-2 text-xs text-ink/45">{wiki.pricingNotes}</p>
              )}
            </>
          )}

          {wiki.features?.length > 0 && (
            <>
              <H>Features</H>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {wiki.features.map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-ink/70">
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
                  </div>
                ))}
              </div>
            </>
          )}

          {(wiki.pros?.length > 0 || wiki.cons?.length > 0) && (
            <>
              <H>Pros &amp; cons</H>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProCon items={wiki.pros} positive />
                <ProCon items={wiki.cons} />
              </div>
            </>
          )}

          {wiki.integrations?.length > 0 && (
            <>
              <H>Integrations</H>
              <div className="flex flex-wrap gap-2">
                {wiki.integrations.map((x: string, i: number) => (
                  <span key={i} className="chip px-2.5 py-1 text-xs text-ink/65">
                    {x}
                  </span>
                ))}
              </div>
            </>
          )}

          {wiki.alternatives?.length > 0 && (
            <>
              <H>Alternatives</H>
              <div className="flex flex-wrap gap-2">
                {wiki.alternatives.map((x: string, i: number) => (
                  <span key={i} className="chip px-3 py-1.5 text-sm text-ink/70">
                    {x}
                  </span>
                ))}
              </div>
            </>
          )}

          {wiki.sources?.length > 0 && (
            <>
              <H>Sources</H>
              <ul className="space-y-1.5">
                {wiki.sources.map((s: any, i: number) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                    >
                      <ExternalLink size={13} /> {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-8 text-xs text-ink/35">
            Researched live by {wiki.model} · updated{" "}
            {new Date(wiki.updatedAt).toLocaleDateString()}
          </p>
        </>
      )}
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-ink/40">
    {children}
  </h2>
);

const Tag = ({ children, accent }: { children: React.ReactNode; accent?: boolean }) => (
  <span
    className={`rounded-full border border-line px-2.5 py-1 ${accent ? "bg-accent/15 text-accent" : "bg-ink/[0.04] text-ink/60"}`}
  >
    {children}
  </span>
);

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="text-ink/35">{k}</div>
    <div className="font-semibold tabular-nums text-ink/85">{v}</div>
  </div>
);

const Fact = ({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) => (
  <div className="surface flex items-start gap-2.5 p-3.5">
    <span className="mt-0.5 text-ink/40">{icon}</span>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-ink/40">{k}</div>
      <div className="text-sm font-medium text-ink/85">{v}</div>
    </div>
  </div>
);

const ProCon = ({ items, positive }: { items?: string[]; positive?: boolean }) => (
  <div className="surface p-4">
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
      {positive ? "Pros" : "Cons"}
    </div>
    <ul className="space-y-1.5">
      {(items ?? []).map((t, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-ink/70">
          {positive ? (
            <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <X size={15} className="mt-0.5 shrink-0 text-rose-500" />
          )}
          {t}
        </li>
      ))}
    </ul>
  </div>
);
