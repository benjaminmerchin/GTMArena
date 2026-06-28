"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, Sparkles, Search, Phone, Globe, Trophy, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/ui";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe };

export default function Hub() {
  const categories = useQuery(api.categories.list);
  const top = useQuery(api.categories.globalTop, { limit: 8 });

  return (
    <div className="space-y-14">
      <section className="pt-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink/60">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-coral" />
          </span>
          Live · ranked by humans <span className="text-ink/30">+</span> LLMs
        </div>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight">
          <span className="bg-gradient-to-br from-white to-white/55 bg-clip-text text-transparent">
            Find the best tools for your
          </span>{" "}
          <span className="bg-gradient-to-br from-coral to-magenta bg-clip-text text-transparent">
            AI&nbsp;agents&rsquo; GTM stack.
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/55">
          A crowdsourced leaderboard for low-level GTM tools. Blind A/B{" "}
          <b className="text-ink/80">battles</b> rank quality (humans <i>and</i>{" "}
          LLMs vote); the live enrichment <b className="text-ink/80">race</b>{" "}
          grades providers on real data. Sort by quality, price, ease, and speed.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink/50">
          <Trophy size={15} className="text-coral" /> Top GTM tools right now
        </div>
        <div className="flex flex-wrap gap-2">
          {top?.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tool/${t.slug}`}
              className="chip flex items-center gap-2 px-3 py-1.5 text-sm transition hover:border-coral/60"
            >
              <span className="text-ink/30 tabular-nums">{i + 1}</span>
              <span className="font-medium">{t.name}</span>
              <span className="text-coral/90 tabular-nums">{t.elo}</span>
            </Link>
          ))}
          {!top && <Skeleton n={6} />}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-ink/50">Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((c) => {
            const Icon = ICONS[c.icon] ?? Sparkles;
            return (
              <Link
                key={c.key}
                href={`/c/${c.key}`}
                className="surface surface-hover group relative overflow-hidden p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-ink/80">
                    <Icon size={17} />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                      c.mode === "race"
                        ? "bg-coral/15 text-coral"
                        : "bg-white/[0.06] text-ink/45",
                    )}
                  >
                    {c.mode === "race" ? "RACE" : "BATTLE"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 font-display font-semibold">
                  {c.name}
                  <ArrowUpRight
                    size={15}
                    className="text-ink/25 transition group-hover:text-coral"
                  />
                </div>
                <p className="mt-1 text-sm text-ink/50">{c.tagline}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink/35">{c.toolCount} tools</span>
                  {c.topTool && (
                    <span className="text-ink/55">
                      <span className="text-coral/80">#1</span>{" "}
                      <b className="font-medium text-ink/80">{c.topTool.name}</b>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {!categories && <Skeleton n={6} card />}
        </div>
      </section>
    </div>
  );
}

function Skeleton({ n, card }: { n: number; card?: boolean }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-white/5",
            card ? "h-44 rounded-2xl" : "h-8 w-28 rounded-full",
          )}
        />
      ))}
    </>
  );
}
