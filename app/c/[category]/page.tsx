"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, SORTS, SEGMENTS, SortKey, fmtSpeed, fmtCost } from "@/lib/ui";
import { Swords, Zap, Sparkles } from "lucide-react";

export default function CategoryPage() {
  const category = String(useParams().category);
  const cat = useQuery(api.categories.get, { key: category });
  const ranking = useQuery(api.rankings.getLatest, { category });
  const [sort, setSort] = useState<SortKey>("quality");
  const [segment, setSegment] = useState("all");
  const rows = useQuery(api.leaderboard.get, { category, sort, segment });

  const dims = new Set(cat?.dimensions ?? ["quality", "affordability", "ease", "speed"]);
  const sorts = SORTS.filter((s) => dims.has(s.key));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-accent">Category</div>
          <h1 className="mt-1 font-display text-4xl text-white">{cat?.name ?? "…"}</h1>
          <p className="mt-2 max-w-xl text-ink/55">{cat?.tagline}</p>
        </div>
        {cat &&
          (cat.mode === "race" ? (
            <Link href="/race" className="btn-navy">
              <Zap size={16} /> Run live race
            </Link>
          ) : (
            <Link href={`/battle/${category}`} className="btn-navy">
              <Swords size={16} /> Enter battle
            </Link>
          ))}
      </div>

      {/* AI ranking — the curation layer */}
      <div className="surface mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles size={15} className="text-accent" /> AI ranking
          </div>
          <div className="text-xs text-ink/40">ranked by {ranking?.model ?? "gpt-5.5"}</div>
        </div>
        {ranking?.entries?.map((e: any) => (
          <Link
            key={e.slug}
            href={`/tool/${e.slug}`}
            className="flex items-start gap-3.5 border-b border-line px-5 py-4 transition last:border-0 hover:bg-white/[0.03]"
          >
            <span
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                e.rank === 1 ? "bg-accent text-white" : "bg-white/[0.06] text-ink/60",
              )}
            >
              {e.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{e.name}</span>
                {e.freeTier && (
                  <span className="rounded-full bg-c1/15 px-1.5 py-0.5 text-[10px] font-medium text-c1">
                    free
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink/55">{e.rationale}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">
              {e.score}
            </span>
          </Link>
        ))}
        {!ranking && <div className="p-6 text-sm text-ink/40">No AI ranking yet.</div>}
      </div>

      {/* arena signals — the evidence the ranking is grounded in */}
      <h2 className="mb-3 mt-12 text-sm font-semibold uppercase tracking-wide text-ink/40">
        Arena signals
      </h2>
      <div className="flex flex-wrap items-center gap-2.5">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              sort === s.key
                ? "border-navy bg-navy text-white"
                : "border-line bg-white/[0.03] text-ink/65 hover:border-white/25 hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1.5 h-6 w-px bg-line" />
        {SEGMENTS.map((sg) => (
          <button
            key={sg.key}
            onClick={() => setSegment(sg.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition",
              segment === sg.key
                ? "border-white/30 bg-white/10 text-white"
                : "border-line bg-white/[0.02] text-ink/50 hover:border-white/20",
            )}
          >
            {sg.label}
          </button>
        ))}
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Tool</div>
          <div className="col-span-2 text-right">Quality</div>
          <div className="col-span-2 text-right">Cost</div>
          <div className="col-span-1 text-right">Ease</div>
          <div className="col-span-2 text-right">Speed</div>
        </div>
        {rows?.map((r) => (
          <Link
            key={r.toolId}
            href={`/tool/${r.slug}`}
            className="grid grid-cols-12 items-center gap-3 border-b border-line px-5 py-3.5 text-sm transition last:border-0 hover:bg-white/[0.03]"
          >
            <div className="col-span-1 tabular-nums text-ink/40">{r.rank}</div>
            <div className="col-span-4 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white/[0.05] text-[11px] font-semibold text-ink/70">
                {r.logoText}
              </span>
              <span className="font-medium text-ink">{r.name}</span>
              {r.freeTier && (
                <span className="rounded-full bg-c1/15 px-2 py-0.5 text-[10px] font-medium text-c1">
                  free tier
                </span>
              )}
            </div>
            <div className="col-span-2 text-right">
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  sort === "quality" ? "text-accent" : "text-ink/80",
                )}
              >
                {r.elo}
              </span>
            </div>
            <div className="col-span-2 text-right tabular-nums text-ink/70">
              {fmtCost(r.cost, r.costUnit)}
            </div>
            <div className="col-span-1 text-right tabular-nums text-ink/70">
              {r.easeScore.toFixed(1)}
            </div>
            <div className="col-span-2 text-right tabular-nums text-ink/70">
              {fmtSpeed(r.speedMs)}
            </div>
          </Link>
        ))}
        {!rows && <div className="p-8 text-sm text-ink/40">Loading…</div>}
      </div>
    </div>
  );
}
