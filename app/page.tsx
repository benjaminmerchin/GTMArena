"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, Sparkles, Search, Phone, Globe, Trophy } from "lucide-react";
import { cn } from "@/lib/ui";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe };

export default function Hub() {
  const categories = useQuery(api.categories.list);
  const top = useQuery(api.categories.globalTop, { limit: 8 });

  return (
    <div className="space-y-12">
      <section className="pt-4">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight">
          Find the best tools for your AI&nbsp;agents&rsquo; GTM stack.
        </h1>
        <p className="mt-3 max-w-2xl text-ink/60">
          A crowdsourced leaderboard for low-level GTM tools. Blind A/B{" "}
          <b>battles</b> rank quality (humans <i>and</i> LLMs vote); the live
          enrichment <b>race</b> grades providers on real data. Sort by quality,
          price, ease, and speed.
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
              className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm transition hover:border-coral"
            >
              <span className="text-ink/30">#{i + 1}</span>
              <span className="font-medium">{t.name}</span>
              <span className="text-ink/40 tabular-nums">{t.elo}</span>
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
                className="group rounded-2xl border bg-white p-5 transition hover:border-coral hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Icon size={20} className="text-ink/70" />
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      c.mode === "race"
                        ? "bg-coral/10 text-coral"
                        : "bg-ink/5 text-ink/50",
                    )}
                  >
                    {c.mode === "race" ? "RACE" : "BATTLE"}
                  </span>
                </div>
                <div className="mt-3 font-semibold">{c.name}</div>
                <p className="mt-1 text-sm text-ink/55">{c.tagline}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink/40">{c.toolCount} tools</span>
                  {c.topTool && (
                    <span className="text-ink/60">
                      #1 <b className="font-medium">{c.topTool.name}</b>
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
            "animate-pulse bg-ink/5",
            card ? "h-40 rounded-2xl" : "h-8 w-28 rounded-full",
          )}
        />
      ))}
    </>
  );
}
