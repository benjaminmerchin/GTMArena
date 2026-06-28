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
    <div className="space-y-6">
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        ← All categories
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{cat?.name ?? "…"}</h1>
          <p className="text-ink/55">{cat?.tagline}</p>
        </div>
        {cat &&
          (cat.mode === "race" ? (
            <Link
              href="/race"
              className="flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-medium text-white"
            >
              <Zap size={16} /> Run live race
            </Link>
          ) : (
            <Link
              href={`/battle/${category}`}
              className="flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-medium text-white"
            >
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
                ? "border-coral bg-coral text-white"
                : "bg-white hover:border-ink/30",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-ink/10" />
        {SEGMENTS.map((sg) => (
          <button
            key={sg.key}
            onClick={() => setSegment(sg.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition",
              segment === sg.key
                ? "border-ink bg-ink text-white"
                : "bg-white text-ink/60 hover:border-ink/30",
            )}
          >
            {sg.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="grid grid-cols-12 gap-2 border-b px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink/40">
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
            className="grid grid-cols-12 items-center gap-2 border-b px-4 py-3 text-sm last:border-0 hover:bg-ink/[0.015]"
          >
            <div className="col-span-1 text-ink/40 tabular-nums">{r.rank}</div>
            <div className="col-span-4 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-ink/5 text-[11px] font-semibold text-ink/60">
                {r.logoText}
              </span>
              <span className="font-medium">{r.name}</span>
              {r.freeTier && (
                <span className="rounded bg-chartreuse/20 px-1.5 py-0.5 text-[10px] font-medium text-ink/60">
                  free tier
                </span>
              )}
            </div>
            <div className="col-span-2 text-right">
              <span
                className="font-medium tabular-nums"
                style={{ color: sort === "quality" ? "#FF6F61" : undefined }}
              >
                {r.elo}
              </span>
            </div>
            <div className="col-span-2 text-right tabular-nums">
              {fmtCost(r.cost, r.costUnit)}
            </div>
            <div className="col-span-1 text-right tabular-nums">
              {r.easeScore.toFixed(1)}
            </div>
            <div className="col-span-2 text-right tabular-nums">
              {fmtSpeed(r.speedMs)}
            </div>
          </Link>
        ))}
        {!rows && <div className="p-6 text-sm text-ink/40">Loading…</div>}
        {rows && rows.length === 0 && (
          <div className="p-6 text-sm text-ink/40">No tools in this segment yet.</div>
        )}
      </div>
    </div>
  );
}
