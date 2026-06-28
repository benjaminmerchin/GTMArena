"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, CATEGORY_META } from "@/lib/ui";
import { Mail, Sparkles, Search, Phone, Globe, ArrowUp, Trophy } from "lucide-react";

const ICONS: Record<string, any> = { Mail, Sparkles, Search, Phone, Globe };

export default function Hub() {
  const router = useRouter();
  const [task, setTask] = useState("");
  const [cat, setCat] = useState("cold-email");
  const top = useQuery(api.categories.globalTop, { limit: 8 });

  const isRace = cat === "enrichment";
  const go = (c = cat) => router.push(c === "enrichment" ? "/race" : `/battle/${c}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs text-ink/55">
          <Sparkles size={13} className="text-accent" />
          Benchmark low-level GTM tools — humans &amp; LLMs vote
        </div>
        <h1 className="font-display text-[3.25rem] leading-[1.07] text-ink sm:text-[3.75rem]">
          Which GTM tool should
          <br />
          you actually use?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink/55">
          Describe a task and pick a category — two tools battle blind and you
          vote. Or race enrichment providers live on a real lead list.
        </p>
      </div>

      {/* chat-style input */}
      <div className="surface mt-12 p-3.5">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={2}
          placeholder={
            isRace
              ? "Describe the leads to enrich — or just run the demo law-firm list…"
              : "Describe your GTM task — e.g. “a cold email to a VP of Sales at a 200-person SaaS”"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go();
          }}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink/35"
        />
        <div className="flex items-center justify-between px-1.5 pt-1.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F2F5FA] px-3 py-1 text-xs font-medium text-ink/60">
            {isRace ? "⚡ Race mode · live grader" : "⚔ Battle mode · blind A/B vote"}
          </span>
          <button
            onClick={() => go()}
            aria-label="Start"
            className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white shadow-navy transition hover:brightness-125"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* category options */}
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        {CATEGORY_META.map((c) => {
          const Icon = ICONS[c.icon] ?? Sparkles;
          const active = cat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition",
                active
                  ? "border-navy bg-navy text-white shadow-navy"
                  : "border-line bg-white text-ink/70 hover:border-[#cfd8e6] hover:text-ink",
              )}
            >
              <Icon size={15} /> {c.name}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-ink/40">
        Select a category, then press the arrow (or ⌘↵) to start.
      </p>

      {/* top tools */}
      <div className="mt-20">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-ink/45">
          <Trophy size={15} className="text-accent" /> Top GTM tools right now
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {top?.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tool/${t.slug}`}
              className="chip flex items-center gap-2 px-3.5 py-2 text-sm transition hover:border-[#cfd8e6]"
            >
              <span className="text-ink/30 tabular-nums">{i + 1}</span>
              <span className="font-medium text-ink">{t.name}</span>
              <span className="font-medium text-accent tabular-nums">{t.elo}</span>
            </Link>
          ))}
          {!top &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-28 animate-pulse rounded-full bg-[#F2F5FA]" />
            ))}
        </div>
      </div>
    </div>
  );
}
