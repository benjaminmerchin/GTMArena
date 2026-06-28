"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { fmtCost, fmtSpeed } from "@/lib/ui";

export default function ToolProfile() {
  const slug = String(useParams().slug);
  const data = useQuery(api.tools.getProfile, { slug });

  if (data === undefined) return <div className="p-10 text-ink/40">Loading…</div>;
  if (data === null) return <div className="p-10 text-ink/40">Tool not found.</div>;

  const { tool, badges } = data;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        ← Hub
      </Link>

      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-ink/5 text-lg font-semibold text-ink/60">
          {tool.logoText}
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{tool.name}</h1>
          <p className="text-ink/55">{tool.blurb}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Tag>{tool.pricingModel}</Tag>
            {tool.freeTier && <Tag>free tier</Tag>}
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

      <h2 className="text-sm font-medium text-ink/50">Rankings across categories</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {badges.map((b: any) => (
          <Link
            key={b.category}
            href={`/c/${b.category}`}
            className="rounded-2xl border bg-white p-4 transition hover:border-coral"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{b.categoryName}</span>
              <span className="rounded-full bg-coral/10 px-2 py-0.5 text-sm font-semibold text-coral">
                #{b.rank}
                <span className="font-normal text-ink/40"> / {b.of}</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-ink/55">
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

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border bg-white px-2 py-0.5 text-ink/60">{children}</span>
);

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="text-ink/35">{k}</div>
    <div className="font-medium text-ink/80 tabular-nums">{v}</div>
  </div>
);
