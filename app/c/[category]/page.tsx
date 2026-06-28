"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, SORTS, SEGMENTS, SortKey, fmtSpeed, fmtCost } from "@/lib/ui";
import { Swords, Zap, ArrowLeft } from "lucide-react";

export default function CategoryPage() {
  const category = String(useParams().category);
  const cat = useQuery(api.categories.get, { key: category });
  const [sort, setSort] = useState<SortKey>("quality");
  const [segment, setSegment] = useState("all");
  const rows = useQuery(api.leaderboard.get, { category, sort, segment });

  const dims = new Set(cat?.dimensions ?? ["quality", "affordability", "ease", "speed"]);
  const sorts = SORTS.filter((s) => dims.has(s.key));

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink/45 transition hover:text-ink"
      >
        <ArrowLeft size={14} /> All categories
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {cat?.name ?? "…"}
          </h1>
          <p className="mt-1 text-ink/50">{cat?.tagline}</p>
        </div>
        {cat &&
          (cat.mode === "race" ? (
            <Link href="/race" className="btn-accent">
              <Zap size={16} /> Run live race
            </Link>
          ) : (
            <Link href={`/battle/${category}`} className="btn-accent">
              <Swords size={16} /> Enter battle
            </Link>
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              sort === s.key
                ? "border-coral bg-coral text-white shadow-glow"
                : "border-white/10 bg-white/[0.03] text-ink/70 hover:border-white/25",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {SEGMENTS.map((sg) => (
          <button
            key={sg.key}
            onClick={() => setSegment(sg.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition",
              segment === sg.key
                ? "border-white/30 bg-white/10 text-ink"
                : "border-white/[0.08] bg-white/[0.02] text-ink/45 hover:border-white/20",
            )}
          >
            {sg.label}
          </button>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink/35">
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
            className="grid grid-cols-12 items-center gap-2 border-b border-white/[0.05] px-4 py-3 text-sm transition last:border-0 hover:bg-white/[0.03]"
          >
            <div className="col-span-1 tabular-nums text-ink/35">{r.rank}</div>
            <div className="col-span-4 flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-[11px] font-semibold text-ink/70">
                {r.logoText}
              </span>
              <span className="font-medium">{r.name}</span>
              {r.freeTier && (
                <span className="rounded bg-chartreuse/15 px-1.5 py-0.5 text-[10px] font-medium text-chartreuse">
                  free
                </span>
              )}
            </div>
            <div className="col-span-2 text-right">
              <span
                className={cn(
                  "font-medium tabular-nums",
                  sort === "quality" ? "text-coral" : "text-ink/80",
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
        {!rows && <div className="p-6 text-sm text-ink/35">Loading…</div>}
        {rows && rows.length === 0 && (
          <div className="p-6 text-sm text-ink/35">No tools in this segment yet.</div>
        )}
      </div>
    </div>
  );
}
