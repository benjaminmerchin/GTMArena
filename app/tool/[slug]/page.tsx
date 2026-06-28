"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fmtCost, fmtSpeed } from "@/lib/ui";
import { ArrowLeft } from "lucide-react";

export default function ToolProfile() {
  const slug = String(useParams().slug);
  const data = useQuery(api.tools.getProfile, { slug });

  if (data === undefined) return <div className="p-10 text-ink/35">Loading…</div>;
  if (data === null) return <div className="p-10 text-ink/35">Tool not found.</div>;

  const { tool, badges } = data;

  return (
    <div className="space-y-7">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink/45 transition hover:text-ink"
      >
        <ArrowLeft size={14} /> Hub
      </Link>

      <div className="flex items-start gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-ink/80">
          {tool.logoText}
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="mt-1 text-ink/50">{tool.blurb}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Tag>{tool.pricingModel}</Tag>
            {tool.freeTier && <Tag accent>free tier</Tag>}
            <Tag>{tool.openSource ? "open source" : "closed source"}</Tag>
            <Tag>auth: {tool.auth}</Tag>
            <Tag>docs {tool.docsQuality}/5</Tag>
            <Tag>{tool.maintenance}</Tag>
            {tool.productionReady && <Tag>production-ready</Tag>}
            {tool.url && (
              <a
                className="text-coral hover:underline"
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

      <h2 className="text-sm font-medium text-ink/45">Rankings across categories</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {badges.map((b: any) => (
          <Link key={b.category} href={`/c/${b.category}`} className="surface surface-hover p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-medium">{b.categoryName}</span>
              <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-sm font-semibold text-coral">
                #{b.rank}
                <span className="font-normal text-ink/35"> / {b.of}</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
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
    className={`chip px-2.5 py-0.5 ${accent ? "text-chartreuse" : "text-ink/55"}`}
  >
    {children}
  </span>
);

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="text-ink/30">{k}</div>
    <div className="font-medium tabular-nums text-ink/85">{v}</div>
  </div>
);
