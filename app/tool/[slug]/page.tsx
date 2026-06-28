"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fmtCost, fmtSpeed } from "@/lib/ui";

export default function ToolProfile() {
  const slug = String(useParams().slug);
  const data = useQuery(api.tools.getProfile, { slug });

  if (data === undefined)
    return <div className="mx-auto max-w-5xl px-6 py-10 text-ink/40 lg:px-10">Loading…</div>;
  if (data === null)
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-ink/40 lg:px-10">Tool not found.</div>
    );

  const { tool, badges } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        ← Hub
      </Link>

      <div className="mt-5 flex items-start gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-white/[0.05] text-lg font-semibold text-ink/80">
          {tool.logoText}
        </span>
        <div>
          <h1 className="font-display text-4xl text-white">{tool.name}</h1>
          <p className="mt-1.5 text-ink/55">{tool.blurb}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <Tag>{tool.pricingModel}</Tag>
            {tool.freeTier && <Tag accent>free tier</Tag>}
            <Tag>{tool.openSource ? "open source" : "closed source"}</Tag>
            <Tag>auth: {tool.auth}</Tag>
            <Tag>docs {tool.docsQuality}/5</Tag>
            <Tag>{tool.maintenance}</Tag>
            {tool.productionReady && <Tag>production-ready</Tag>}
            {tool.url && (
              <a
                className="font-medium text-accent hover:underline"
                href={tool.url}
                target="_blank"
                rel="noreferrer"
              >
                website ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-wide text-ink/40">
        Rankings across categories
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {badges.map((b: any) => (
          <Link key={b.category} href={`/c/${b.category}`} className="surface surface-hover p-5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{b.categoryName}</span>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent">
                #{b.rank}
                <span className="font-normal text-ink/35"> / {b.of}</span>
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
              <Stat k="Elo" v={String(b.elo)} />
              <Stat k="Cost" v={fmtCost(b.cost, b.costUnit)} />
              <Stat k="Ease" v={b.easeScore.toFixed(1)} />
              <Stat k="Speed" v={fmtSpeed(b.speedMs)} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const Tag = ({ children, accent }: { children: React.ReactNode; accent?: boolean }) => (
  <span
    className={`rounded-full border border-line px-2.5 py-1 ${accent ? "bg-c1/15 text-c1" : "bg-white/[0.04] text-ink/60"}`}
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
