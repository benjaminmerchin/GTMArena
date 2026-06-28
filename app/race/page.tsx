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
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-accent">Race · live grader</div>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Enrichment Arena</h1>
          <p className="mt-2 max-w-2xl text-ink/55">
            Drop a lead list → providers fill columns live → an objective grader
            scores email validity, coverage &amp; cost-per-valid.
          </p>
        </div>
        <button onClick={start} disabled={busy} className="btn-navy">
          <Zap size={16} /> {raceId ? "New race" : "Run race"}
        </button>
      </div>

      {!raceId && (
        <div className="surface mt-8 p-14 text-center text-ink/50">
          Press <b className="text-ink">Run race</b> to bake off the top
          enrichment providers on a law-firm lead list.
        </div>
      )}

      {providers.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p: any, i: number) => (
            <div
              key={p.toolId}
              className="surface overflow-hidden p-5"
              style={{ borderTopColor: CONTESTANT[i], borderTopWidth: 3 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{p.name}</span>
                <span className="text-xs tabular-nums text-ink/40">
                  {p.filled}/{p.total}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(p.filled / Math.max(p.total, 1)) * 100}%`,
                    background: CONTESTANT[i],
                  }}
                />
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Email valid" v={fmtPct(p.emailValidity)} accent />
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
        <div className="surface mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3 font-semibold">Lead</th>
                {providers.map((p: any, i: number) => (
                  <th
                    key={p.toolId}
                    className="px-4 py-3 font-semibold"
                    style={{ color: CONTESTANT[i] }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-ink">{l.name}</div>
                    <div className="text-xs text-ink/40">{l.company}</div>
                  </td>
                  {providers.map((p: any) => {
                    const c = cellOf(l.id, p.toolId);
                    return (
                      <td key={p.toolId} className="px-4 py-3 align-top">
                        {!c || c.status === "pending" ? (
                          <span className="text-ink/20">·</span>
                        ) : c.status === "running" ? (
                          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-c2" />
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="max-w-[180px] truncate text-ink/75">
                                {c.fields?.email ?? "—"}
                              </span>
                              {c.fields?.email &&
                                (c.fields?.emailValid ? (
                                  <span title="valid" className="font-semibold text-c1">
                                    ✓
                                  </span>
                                ) : (
                                  <span title="risky" className="font-semibold text-c3">
                                    !
                                  </span>
                                ))}
                            </div>
                            <div className="text-[11px] tabular-nums text-ink/35">
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
        <div className="mt-6 text-center text-sm font-medium text-accent">
          Race complete — results rolled into the enrichment leaderboard.
        </div>
      )}
    </div>
  );
}

const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-ink/45">{k}</dt>
    <dd className={`font-semibold tabular-nums ${accent ? "text-accent" : "text-ink/85"}`}>
      {v}
    </dd>
  </div>
);
