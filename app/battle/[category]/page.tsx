"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn, CONTESTANT } from "@/lib/ui";
import { Sparkles } from "lucide-react";

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
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/c/${category}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            ← {category.replace("-", " ")} leaderboard
          </Link>
          <h1 className="mt-1 font-display text-4xl capitalize text-white">
            {category.replace("-", " ")} battle
          </h1>
        </div>
        <button onClick={llmJudge} disabled={busy || judging} className="btn-soft">
          <Sparkles size={15} className="text-accent" />
          {judging ? "LLM judging…" : "Let an LLM judge"}
        </button>
      </div>

      {battle && (
        <div className="surface mt-8 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
            Shared task
          </div>
          <p className="mt-1.5 text-[15px] text-ink/85">{battle.task}</p>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {battle?.contestants.map((c, i) => {
          const rev = reveal?.reveal.find((r: any) => r.label === c.label);
          const won = reveal && reveal.result === c.label;
          return (
            <div
              key={c.label}
              className="surface flex flex-col p-5 transition"
              style={{
                borderColor: reveal ? CONTESTANT[i] : undefined,
                boxShadow: won ? "0 0 0 1.5px #6AA0FF, 0 16px 40px -16px #2f6fed66" : undefined,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold text-[#0A0F1C]"
                    style={{ background: reveal ? CONTESTANT[i] : "rgba(255,255,255,0.16)" }}
                  >
                    {c.label}
                  </span>
                  {rev ? (
                    <Link href={`/tool/${rev.slug}`} className="text-ink hover:text-accent">
                      {rev.name}
                    </Link>
                  ) : (
                    <span className="text-ink/55">Anonymous</span>
                  )}
                  {won && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
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
          <div className="p-12 text-center text-ink/40 md:col-span-2">Loading battle…</div>
        )}
      </div>

      {battle && !reveal && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <VoteBtn onClick={() => castVote("A")} disabled={busy}>← A better</VoteBtn>
          <VoteBtn onClick={() => castVote("tie")} disabled={busy}>Tie</VoteBtn>
          <VoteBtn onClick={() => castVote("bothBad")} disabled={busy}>Both bad</VoteBtn>
          <VoteBtn onClick={() => castVote("B")} disabled={busy}>B better →</VoteBtn>
        </div>
      )}

      {reveal && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm text-ink/55">
            {reveal.result === "tie"
              ? "Tie."
              : reveal.result === "bothBad"
                ? "Both bad."
                : `${winnerName} wins.`}
          </span>
          <button onClick={load} className="btn-navy">
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
      className="rounded-xl border border-line bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:bg-white/[0.07] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
