"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, Sparkles, Search, Phone, Globe, ArrowUpRight, Trophy, Bot, Radar } from "lucide-react";
import { cn } from "@/lib/ui";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe, Bot, Radar };

export default function LeaderboardsIndex() {
  const cats = useQuery(api.categories.list);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex items-center gap-2 text-sm font-medium text-accent">
        <Trophy size={15} /> Leaderboards
      </div>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">
        Every GTM category, ranked
      </h1>
      <p className="mt-2 max-w-xl text-ink/55">
        Pick a category to see its AI ranking (GPT-5.5) and the live arena signals.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats?.map((c: any) => {
          const Icon = ICONS[c.icon] ?? Sparkles;
          return (
            <Link key={c.key} href={`/c/${c.key}`} className="surface surface-hover group p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-ink/5 text-ink/80">
                  <Icon size={17} />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                    c.mode === "race"
                      ? "bg-accent/15 text-accent"
                      : "bg-ink/[0.06] text-ink/45",
                  )}
                >
                  {c.mode === "race" ? "RACE" : "BATTLE"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 font-display font-semibold text-ink">
                {c.name}
                <ArrowUpRight
                  size={15}
                  className="text-ink/25 transition group-hover:text-accent"
                />
              </div>
              <p className="mt-1 text-sm text-ink/50">{c.tagline}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink/35">{c.toolCount} tools</span>
                {c.topTool && (
                  <span className="text-ink/55">
                    <span className="text-accent">#1</span>{" "}
                    <b className="font-medium text-ink/80">{c.topTool.name}</b>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {!cats &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink/5" />
          ))}
      </div>
    </div>
  );
}
