"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, SORTS, SEGMENTS, SortKey, fmtSpeed, fmtCost } from "@/lib/ui";
import { Swords, Zap } from "lucide-react";

export default function CategoryPage() {
  const category = String(useParams().category);
  const cat = useQuery(api.categories.get, { key: category });
  const [sort, setSort] = useState<SortKey>("quality");
  const [segment, setSegment] = useState("all");
  const rows = useQuery(api.leaderboard.get, { category, sort, segment });

  const dims = new Set(cat?.dimensions ?? ["quality", "affordability", "ease", "speed"]);
  const sorts = SORTS.filter((s) => dims.has(s.key));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-accent">Leaderboard</div>
          <h1 className="mt-1 font-display text-4xl text-ink">{cat?.name ?? "…"}</h1>
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

      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              sort === s.key
                ? "border-navy bg-navy text-white shadow-navy"
                : "border-line bg-white text-ink/65 hover:border-[#cfd8e6] hover:text-ink",
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
                ? "border-ink/25 bg-[#EEF3FC] text-navy"
                : "border-line bg-white text-ink/50 hover:border-[#cfd8e6]",
            )}
          >
            {sg.label}
          </button>
        ))}
      </div>

      <div className="surface mt-6 overflow-hidden">
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
            className="grid grid-cols-12 items-center gap-3 border-b border-line px-5 py-3.5 text-sm transition last:border-0 hover:bg-[#F7F9FC]"
          >
            <div className="col-span-1 tabular-nums text-ink/40">{r.rank}</div>
            <div className="col-span-4 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-[#F6F8FB] text-[11px] font-semibold text-ink/70">
                {r.logoText}
              </span>
              <span className="font-medium text-ink">{r.name}</span>
              {r.freeTier && (
                <span className="rounded-full bg-c1/10 px-2 py-0.5 text-[10px] font-medium text-c1">
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
        {rows && rows.length === 0 && (
          <div className="p-8 text-sm text-ink/40">No tools in this segment yet.</div>
        )}
      </div>
    </div>
  );
}
