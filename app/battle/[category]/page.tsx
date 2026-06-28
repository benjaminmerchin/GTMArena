"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, CONTESTANT } from "@/lib/ui";
import { ArrowLeft, Sparkles } from "lucide-react";

type Battle = {
  battleId: string;
  task: string;
  context: string | null;
  contestants: { label: string; output: string }[];
};
type Reveal = { result: string; reveal: any[] };

export default function BattlePage() {
  const category = String(useParams().category);
  const next = useMutation(api.battles.next);
  const vote = useMutation(api.battles.castVote);
  const judge = useAction(api.judge.judgeNext);

  const [battle, setBattle] = useState<Battle | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState(false);
  const [judging, setJudging] = useState(false);

  const load = useCallback(async () => {
    setReveal(null);
    setBattle(null);
    setBusy(true);
    try {
      setBattle((await next({ category })) as any);
    } finally {
      setBusy(false);
    }
  }, [category, next]);

  useEffect(() => {
    load();
  }, [load]);

  async function castVote(result: string) {
    if (!battle) return;
    setBusy(true);
    try {
      setReveal((await vote({ battleId: battle.battleId as any, result: result as any })) as any);
    } finally {
      setBusy(false);
    }
  }

  async function llmJudge() {
    setJudging(true);
    setReveal(null);
    try {
      const v: any = await judge({ category });
      setBattle({
        battleId: v.battleId,
        task: v.task,
        context: null,
        contestants: v.reveal.map((r: any) => ({ label: r.label, output: r.output })),
      });
      setReveal({ result: v.winner, reveal: v.reveal });
    } finally {
      setJudging(false);
    }
  }

  const winnerName = reveal?.reveal.find((r: any) => r.label === reveal.result)?.name;

  return (
    <div className="space-y-6">
      <Link
        href={`/c/${category}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink/45 transition hover:text-ink"
      >
        <ArrowLeft size={14} /> {category.replace("-", " ")} leaderboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold capitalize tracking-tight">
          {category.replace("-", " ")} battle
        </h1>
        <button onClick={llmJudge} disabled={busy || judging} className="btn-ghost">
          <Sparkles size={15} className="text-coral" />
          {judging ? "LLM judging…" : "Let an LLM judge"}
        </button>
      </div>

      {battle && (
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink/35">
            Shared task
          </div>
          <p className="mt-1 text-sm text-ink/80">{battle.task}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {battle?.contestants.map((c, i) => {
          const rev = reveal?.reveal.find((r: any) => r.label === c.label);
          const won = reveal && reveal.result === c.label;
          return (
            <div
              key={c.label}
              className={cn(
                "surface flex flex-col p-4 transition",
                won && "shadow-glow",
              )}
              style={{
                borderColor: reveal ? CONTESTANT[i] : undefined,
                boxShadow: won ? "0 0 36px -10px rgba(255,111,97,0.55)" : undefined,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md text-[12px] font-bold text-black"
                    style={{ background: reveal ? CONTESTANT[i] : "rgba(255,255,255,0.12)" }}
                  >
                    {c.label}
                  </span>
                  {rev ? (
                    <Link href={`/tool/${rev.slug}`} className="hover:text-coral">
                      {rev.name}
                    </Link>
                  ) : (
                    <span className="text-ink/55">Anonymous</span>
                  )}
                  {won && (
                    <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-semibold text-coral">
                      WINNER
                    </span>
                  )}
                </span>
                {rev && <span className="text-sm tabular-nums text-ink/45">Elo {rev.elo}</span>}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/75">
                {c.output}
              </pre>
            </div>
          );
        })}
        {!battle && (
          <div className="p-10 text-center text-ink/35 md:col-span-2">Loading battle…</div>
        )}
      </div>

      {battle && !reveal && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <VoteBtn onClick={() => castVote("A")} disabled={busy}>← A better</VoteBtn>
          <VoteBtn onClick={() => castVote("tie")} disabled={busy}>Tie</VoteBtn>
          <VoteBtn onClick={() => castVote("bothBad")} disabled={busy}>Both bad</VoteBtn>
          <VoteBtn onClick={() => castVote("B")} disabled={busy}>B better →</VoteBtn>
        </div>
      )}

      {reveal && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-ink/50">
            {reveal.result === "tie"
              ? "Tie."
              : reveal.result === "bothBad"
                ? "Both bad."
                : `${winnerName} wins.`}
          </span>
          <button onClick={load} className="btn-accent">
            Next battle →
          </button>
        </div>
      )}
    </div>
  );
}

function VoteBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition hover:border-coral hover:bg-white/[0.05] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
