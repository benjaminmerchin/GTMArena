"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CONTESTANT, fmtPct, fmtSpeed } from "@/lib/ui";
import { Zap } from "lucide-react";

export default function RacePage() {
  const createRace = useMutation(api.races.createRace);
  const [raceId, setRaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const data = useQuery(api.races.getRace, raceId ? { raceId: raceId as any } : "skip");

  async function start() {
    setBusy(true);
    try {
      const r = await createRace({});
      setRaceId(r.raceId);
    } finally {
      setBusy(false);
    }
  }

  const race = data?.race;
  const providers = data?.providers ?? [];
  const cells = data?.cells ?? [];
  const leads = race?.leads ?? [];
  const cellOf = (leadId: string, toolId: string) =>
    cells.find((c: any) => c.leadId === leadId && c.toolId === toolId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Enrichment Arena</h1>
          <p className="max-w-2xl text-ink/55">
            Drop a lead list → providers fill columns live → an objective grader
            scores email validity, coverage &amp; cost-per-valid.
          </p>
        </div>
        <button
          onClick={start}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Zap size={16} /> {raceId ? "New race" : "Run race"}
        </button>
      </div>

      {!raceId && (
        <div className="rounded-2xl border bg-white p-10 text-center text-ink/45">
          Press <b>Run race</b> to bake off the top enrichment providers on a
          law-firm lead list.
        </div>
      )}

      {providers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p: any, i: number) => (
            <div
              key={p.toolId}
              className="rounded-2xl border bg-white p-4"
              style={{ borderTopColor: CONTESTANT[i], borderTopWidth: 3 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs text-ink/40 tabular-nums">
                  {p.filled}/{p.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(p.filled / Math.max(p.total, 1)) * 100}%`,
                    background: CONTESTANT[i],
                  }}
                />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row k="Email valid" v={fmtPct(p.emailValidity)} />
                <Row k="Coverage" v={fmtPct(p.coverage)} />
                <Row
                  k="Cost / valid"
                  v={p.costPerValid != null ? `$${p.costPerValid.toFixed(3)}` : "—"}
                />
                <Row k="Avg speed" v={fmtSpeed(p.avgLatencyMs)} />
              </dl>
            </div>
          ))}
        </div>
      )}

      {leads.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-ink/40">
                <th className="px-3 py-2 font-medium">Lead</th>
                {providers.map((p: any, i: number) => (
                  <th
                    key={p.toolId}
                    className="px-3 py-2 font-medium"
                    style={{ color: CONTESTANT[i] }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-ink/40">{l.company}</div>
                  </td>
                  {providers.map((p: any) => {
                    const c = cellOf(l.id, p.toolId);
                    return (
                      <td key={p.toolId} className="px-3 py-2 align-top">
                        {!c || c.status === "pending" ? (
                          <span className="text-ink/25">·</span>
                        ) : c.status === "running" ? (
                          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-mustard" />
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="max-w-[170px] truncate text-ink/80">
                                {c.fields?.email ?? "—"}
                              </span>
                              {c.fields?.email &&
                                (c.fields?.emailValid ? (
                                  <span title="valid" className="text-chartreuse">
                                    ✓
                                  </span>
                                ) : (
                                  <span title="risky" className="text-terracotta">
                                    !
                                  </span>
                                ))}
                            </div>
                            <div className="text-[11px] text-ink/35 tabular-nums">
                              {fmtPct(c.coverage)} cov
                              {c.cost != null && ` · $${c.cost.toFixed(3)}`}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {race?.status === "done" && (
        <div className="text-center text-sm font-medium text-coral">
          Race complete — results rolled into the enrichment leaderboard.
        </div>
      )}
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between">
    <dt className="text-ink/45">{k}</dt>
    <dd className="font-medium tabular-nums">{v}</dd>
  </div>
);
