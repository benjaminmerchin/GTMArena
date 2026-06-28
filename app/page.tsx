"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_META } from "@/lib/ui";
import { Mail, Sparkles, Search, Phone, Globe, ArrowUp, Trophy, ArrowRight } from "lucide-react";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe };

export default function Hub() {
  const top = useQuery(api.categories.globalTop, { limit: 8 });
  const recommend = useAction(api.recommend.bestTool);
  const [task, setTask] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!task.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      setAnswer(await recommend({ query: task }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-ink/[0.04] px-3.5 py-1.5 text-xs text-ink/60">
          <Sparkles size={13} className="text-accent" /> Rankings by GPT-5.5 · battles by
          humans + LLMs
        </div>
        <h1 className="font-display text-[3.25rem] font-semibold leading-[1.07] text-ink sm:text-[3.75rem]">
          Which GTM tool should
          <br />
          you actually use?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink/55">
          Describe your use case and get the best tool — pulled from an AI-ranked
          leaderboard for every GTM category.
        </p>
      </div>

      <div className="surface mt-12 p-3.5">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={2}
          placeholder="What do you need? e.g. “the best tool to find verified mobile numbers for SMB founders”"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink/35"
        />
        <div className="flex items-center justify-between px-1.5 pt-1.5">
          <span className="text-xs text-ink/40">Answered from the GPT-5.5 ranking</span>
          <button
            onClick={ask}
            disabled={loading}
            aria-label="Ask"
            className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      </div>

      {answer?.best && (
        <div className="surface mt-4 p-5">
          <div className="flex items-center gap-2 text-xs text-ink/50">
            <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
              #1 {answer.categoryName}
            </span>
            {answer.model && <span>ranked by {answer.model}</span>}
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-ink/5 text-sm font-semibold text-ink/80">
              {answer.best.logoText}
            </span>
            <div className="min-w-0">
              <Link
                href={`/tool/${answer.best.slug}`}
                className="font-display text-2xl font-semibold text-ink hover:text-accent"
              >
                {answer.best.name}
              </Link>
              {answer.best.rationale && (
                <p className="mt-1 text-sm text-ink/65">{answer.best.rationale}</p>
              )}
            </div>
          </div>
          {answer.note && (
            <p className="mt-3 text-xs text-ink/40">Why this category: {answer.note}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/tool/${answer.best.slug}`} className="btn-navy">
              View tool
            </Link>
            <Link href={`/c/${answer.category}`} className="btn-soft">
              See full ranking <ArrowRight size={14} />
            </Link>
            {answer.alternatives?.length > 0 && (
              <span className="text-xs text-ink/40">
                also: {answer.alternatives.map((a: any) => a.name).join(", ")}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        {CATEGORY_META.map((c) => {
          const Icon = ICONS[c.icon] ?? Sparkles;
          return (
            <Link
              key={c.key}
              href={`/c/${c.key}`}
              className="flex items-center gap-2 rounded-full border border-line bg-ink/[0.03] px-4 py-2.5 text-sm text-ink/70 transition hover:border-accent/40 hover:text-ink"
            >
              <Icon size={15} /> {c.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-16">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-ink/45">
          <Trophy size={15} className="text-accent" /> Top GTM tools right now
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {top?.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tool/${t.slug}`}
              className="chip flex items-center gap-2 px-3.5 py-2 text-sm transition hover:border-accent/40"
            >
              <span className="text-ink/30 tabular-nums">{i + 1}</span>
              <span className="font-medium text-ink">{t.name}</span>
              <span className="font-medium text-accent tabular-nums">{t.elo}</span>
            </Link>
          ))}
          {!top &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-28 animate-pulse rounded-full bg-ink/[0.04]" />
            ))}
        </div>
      </div>
    </div>
  );
}
