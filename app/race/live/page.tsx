"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CONTESTANT, fmtPct, fmtSpeed } from "@/lib/ui";
import { Zap, Users, ShieldCheck } from "lucide-react";

const PROVIDERS = ["hunter", "prospeo", "people-data-labs", "fiber-ai"];

// Hackathon judges (name, company, optional domain) — public professional info.
const JUDGES = `Louis Liu, REV1
Jad Bousselham, Verdex
Paulina Laba, Tanagram
Shubham Srivastava, Cruitical, cruitical.com
Yash Thakkar, Cruitical, cruitical.com
Neel Majmudar, Imagine AI
Leo Fu, Corgi
Danylo Borodchuk, Lopus
Wayne Sutton, Convex, convex.dev
Apoorv Jha, OpenAI, openai.com`;

function parseLeads(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [name, company, domain] = line.split(",").map((s) => s.trim());
      return { id: `l${i}`, name, company: company || undefined, domain: domain || undefined };
    })
    .filter((l) => l.name);
}

export default function LiveRace() {
  const createRace = useMutation(api.races.createRace);
  const [text, setText] = useState("");
  const [raceId, setRaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const data = useQuery(api.races.getRace, raceId ? { raceId: raceId as any } : "skip");

  async function run() {
    const leads = parseLeads(text);
    if (!leads.length || busy) return;
    setBusy(true);
    try {
      const r = await createRace({
        name: "Live enrichment",
        providerSlugs: PROVIDERS,
        leads,
        requestedFields: ["email", "title", "linkedin"],
        useReal: true,
      });
      setRaceId(r.raceId);
    } finally {
      setBusy(false);
    }
  }

  const race = data?.race;
  const providers = data?.providers ?? [];
  const cells = data?.cells ?? [];
  const leads = race?.leads ?? [];
  const running = race?.status === "running";
  const cellOf = (leadId: string, toolId: string) =>
    cells.find((c: any) => c.leadId === leadId && c.toolId === toolId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-accent">Race · real APIs</div>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Live Enrichment</h1>
          <p className="mt-2 max-w-2xl text-ink/55">
            Drop in a lead list and watch <b className="text-ink">Hunter · Prospeo · PDL · Fiber</b>{" "}
            enrich it live from their real APIs — actual emails, validity, and coverage.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink/[0.03] px-3 py-1.5 text-xs text-ink/55">
          <ShieldCheck size={13} className="text-emerald-500" /> results cached — re-runs are free
        </div>
      </div>

      {!raceId && (
        <div className="surface mt-8 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"Paste leads, one per line:\nName, Company\nName, Company, domain.com"}
            className="w-full resize-none rounded-xl border border-line bg-ink/[0.02] px-4 py-3 font-mono text-[13px] text-ink outline-none transition focus:border-accent placeholder:text-ink/35"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setText(JUDGES)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink/[0.03] px-3 py-1.5 text-sm text-ink/70 transition hover:border-white/25 hover:text-ink"
            >
              <Users size={14} /> Load hackathon judges
            </button>
            <button onClick={run} disabled={busy || !text.trim()} className="btn-navy">
              <Zap size={16} /> {busy ? "Starting…" : "Run live race"}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink/40">
            Only name + company needed — the finders match by company. Coverage will be uneven
            (tiny early-stage companies are hard); that's the real hit-rate.
          </p>
        </div>
      )}

      {providers.length > 0 && (
        <>
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
                  <Row k="Email found" v={fmtPct(p.emailValidity)} accent />
                  <Row k="Coverage" v={fmtPct(p.coverage)} />
                  <Row k="Avg speed" v={fmtSpeed(p.avgLatencyMs)} />
                </dl>
              </div>
            ))}
          </div>

          <div className="surface mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/40">
                  <th className="px-4 py-3 font-semibold">Lead</th>
                  {providers.map((p: any, i: number) => (
                    <th key={p.toolId} className="px-4 py-3 font-semibold" style={{ color: CONTESTANT[i] }}>
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
                      const f = c?.fields ?? {};
                      return (
                        <td key={p.toolId} className="px-4 py-3 align-top">
                          {!c || c.status === "pending" ? (
                            <span className="text-ink/20">·</span>
                          ) : c.status === "running" ? (
                            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-amber-400" />
                          ) : f.email || f.title || f.linkedin ? (
                            <div className="space-y-0.5">
                              {f.email && (
                                <div className="flex items-center gap-1.5">
                                  <span className="max-w-[190px] truncate text-ink/85">{f.email}</span>
                                  <span className={f.emailValid ? "text-emerald-500" : "text-amber-500"}>
                                    {f.emailValid ? "✓" : "?"}
                                  </span>
                                </div>
                              )}
                              {f.title && <div className="text-[11px] text-ink/50">{f.title}</div>}
                              {f.linkedin && (
                                <a
                                  href={f.linkedin.startsWith("http") ? f.linkedin : `https://${f.linkedin}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-accent hover:underline"
                                >
                                  LinkedIn ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink/25">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-ink/45">
              {running ? "Enriching live…" : "Done — winner is whoever found the most, validated, cheapest."}
            </span>
            <button onClick={() => setRaceId(null)} className="btn-soft">
              New list
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const Row = ({ k, v, accent }: { k: string; v: string; accent?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-ink/45">{k}</dt>
    <dd className={`font-semibold tabular-nums ${accent ? "text-accent" : "text-ink/85"}`}>{v}</dd>
  </div>
);
