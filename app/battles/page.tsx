"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, CATEGORY_META } from "@/lib/ui";
import { Swords, Cpu } from "lucide-react";

export default function Battles() {
  const stats = useQuery(api.arena.battleStats);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const battles = useQuery(api.arena.recentBattles, { limit: 60, category });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex items-center gap-2 text-sm font-medium text-accent">
        <Swords size={15} /> Battle Arena
      </div>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Battle history</h1>
      <p className="mt-2 max-w-2xl text-ink/55">
        Every ranking is built from <b className="text-ink">blind</b> head-to-heads: two tools'
        real wiki data (names hidden) judged by a rotating panel of models. No human bias, no
        seeded favourites.
      </p>

      {/* stats */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-line bg-ink/[0.03] px-3 py-1.5 text-sm">
          <b className="text-ink">{stats?.total ?? "—"}</b>{" "}
          <span className="text-ink/50">battles judged</span>
        </span>
        {stats &&
          Object.entries(stats.byModel)
            .sort((a, b) => b[1] - a[1])
            .map(([m, n]) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink/[0.03] px-3 py-1.5 text-xs text-ink/60"
              >
                <Cpu size={12} className="text-accent" /> {m}{" "}
                <span className="tabular-nums text-ink/40">{n}</span>
              </span>
            ))}
      </div>

      {/* category filter */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Chip active={!category} onClick={() => setCategory(undefined)}>
          All
        </Chip>
        {CATEGORY_META.map((c) => (
          <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
            {c.name}
          </Chip>
        ))}
      </div>

      {/* battle list */}
      <div className="surface mt-6 divide-y divide-line overflow-hidden">
        {battles?.map((b: any) => (
          <div key={b._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 text-sm">
            <span className="w-28 shrink-0 text-[11px] uppercase tracking-wide text-ink/35">
              {b.category.replace("-", " ")}
            </span>
            <span className="flex items-center gap-2">
              <Side name={b.aName} win={b.winner === "A"} />
              <span className="text-ink/30">vs</span>
              <Side name={b.bName} win={b.winner === "B"} />
            </span>
            <span className="ml-auto flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.04] px-2 py-0.5 text-ink/55">
                <Cpu size={11} className="text-accent" /> {b.model}
              </span>
            </span>
            {b.reason && <p className="w-full pl-28 text-xs text-ink/45">{b.reason}</p>}
          </div>
        ))}
        {!battles && <div className="p-8 text-sm text-ink/40">Loading…</div>}
        {battles && battles.length === 0 && (
          <div className="p-8 text-sm text-ink/40">No battles in this category yet.</div>
        )}
      </div>
    </div>
  );
}

const Chip = ({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-full border px-3 py-1.5 text-xs transition",
      active
        ? "border-navy bg-navy text-white"
        : "border-line bg-ink/[0.02] text-ink/55 hover:border-white/25 hover:text-ink",
    )}
  >
    {children}
  </button>
);

const Side = ({ name, win }: { name: string; win: boolean }) => (
  <span className={win ? "font-semibold text-ink" : "text-ink/45 line-through decoration-ink/20"}>
    {name}
    {win && <span className="ml-1 text-accent">✓</span>}
  </span>
);
