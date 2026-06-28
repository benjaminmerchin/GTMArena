# 🏟️ GTM Arena

**Find the best low-level tools for your GTM stack — ranked by the crowd _and_ by LLMs.**

GTM Arena is a crowdsourced leaderboard that benchmarks **low-level GTM tools** (cold email,
enrichment, email context, parallel dialers, scraping) the way [LMArena](https://lmarena.ai)
benchmarks models and [Design Arena](https://www.designarena.ai) benchmarks designs.

Two modes power it:

| Mode | Logic | Used by | What happens |
|------|-------|---------|--------------|
| **BATTLE** | LMArena | most categories | Blind A/B of two tool outputs → you vote → identities reveal → Elo / win-rate updates |
| **RACE** | Design Arena | the Enrichment Arena | Drop in a lead list → N providers fill columns **live, in parallel** → an objective grader scores email validity, coverage %, cost-per-valid & speed |

Every leaderboard sorts by up to **four dimensions** (a category picks its own subset):
**Quality** (Elo / win-rate) · **Affordability** (cost ↓) · **Ease of Use** (1-5) · **Speed** (ms ↓).

> This repo is the **Convex backend** + seed data + integrations. The frontend (clean light-mode
> React, scaffolded with `better-design`) is mock-first and wires onto this deployment — every
> query/mutation it needs is documented under [Frontend wiring](#frontend-wiring).

**Live dev deployment:** `https://perfect-ptarmigan-440.convex.cloud` · [Convex dashboard](https://dashboard.convex.dev/d/perfect-ptarmigan-440)

Built for the **AI Growth Hackathon** (Orange Slice × YC). Sponsor tracks used: **Convex** (entire
backend + realtime), **Orange Slice** & **Fiber AI** (enrichment providers in the RACE).

---

## Why

GTM engineers drown in tool choice. "Which email finder actually verifies?" "Cheapest cost-per-valid
for SMB?" "Best scraper for an agent?" Vendor pages all claim #1. GTM Arena answers with **evidence**:
blind human + LLM votes for subjective quality, and an **objective bake-off** for enrichment where the
numbers (validity, coverage, cost-per-valid) are computed live, not marketed.

---

## Architecture

```
            ┌─────────────────────────── Convex (perfect-ptarmigan-440) ───────────────────────────┐
 frontend   │  queries  categories · leaderboard · tools · battles.get · races.getRace             │
 (React) ──▶│  mutations battles.next/castVote · races.createRace/ingestRace · submissions.submit   │
 useQuery   │  actions  judge.judgeNext (OpenAI) · email.sendDigest (Resend)                        │
 (realtime) │  scheduler  staggered RACE fills → cells tick in live via Convex reactivity           │
            │  data  categories · segments · tools · toolStats · battles · votes · races · raceCells │
            └──────────────────────────────────────────────────────────────────────────────────────┘
                     enrichment providers: simulator (default) · Fiber AI API · Orange Slice toolkit
```

Nothing is faked with client timers — the RACE feels live because the **Convex scheduler** fills cells
over real time and the frontend subscribes to `races.getRace`.

### Data model (`convex/schema.ts`)

- **categories** — the sub-arenas (`mode: battle | race`, `dimensions[]`, `enabled`).
- **segments** — vertical / geo / size filters (`smb`, `mid`, `ent`, `us`, `eu`, `global`).
- **tools** — the rich directory record (pricing, free tier, auth, open-source, docs, maintenance, prod-ready).
- **toolStats** — competitive stats per `(tool, category, segment)`; `segment "all"` = overall. Leaderboards read this; battles & races write it.
- **battleTasks / samples** — shared task prompts + tool-specific blind outputs.
- **battles / votes** — battle instances and every vote (human **or** LLM judge).
- **races / raceCells** — a race and one cell per `(race, lead, provider)` that fills over time.
- **submissions** — "Product Hunt for agent tools": anyone can submit one for review.

---

## Quickstart

```bash
npm install
# .env.local already holds CONVEX_DEPLOY_KEY (gitignored — never commit it)
npx convex dev --once     # push schema + functions, generate types
npm run seed              # load 32 tools across 5 categories  (convex run seed:run)
```

Try it from the CLI:

```bash
npx convex run categories:list
npx convex run leaderboard:get '{"category":"enrichment","sort":"affordability"}'
npx convex run battles:next     '{"category":"cold-email"}'      # → blind battle (note the battleId)
npx convex run battles:castVote '{"battleId":"<id>","result":"A"}'
npx convex run races:createRace  '{}'                            # → live enrichment race (default top-4)
npx convex run races:getRace     '{"raceId":"<id>"}'            # poll → watch columns fill + grader tick
npx convex run judge:judgeNext   '{"category":"cold-email"}'    # LLM (or heuristic) casts a real vote
```

---

## The Enrichment RACE (deep mode)

`races.createRace` drops a lead list against N providers and **schedules a staggered fill** so faster
providers visibly pull ahead. Each cell gets `email` (+validity), `phone`, `title`, `linkedin`, a
`coverage` fraction, a `cost`, and a `latencyMs`. When the last cell lands, the grader:

1. rolls each provider's **coverage / cost-per-valid / speed** into the leaderboard (EMA), and
2. runs a **pairwise Elo mini-tournament** by composite score (validity·coverage − cost − latency).

So a great run on a real lead list literally moves the Quality ranking. (In testing, **Orange Slice**
took #1 on an 83%-validity, $0.058/valid run.)

Providers come from `convex/lib/enrich.ts`:

- **Simulator** (default) — deterministic, provider-flavoured fake enrichment so the race runs with
  zero credentials and still reflects each tool's real character.
- **Fiber AI** (real) — set `FIBER_API_KEY` in the Convex env to hit the live GTM data API.
- **Orange Slice** — a Claude-Code agent toolkit (`npx orangeslice@latest`), driven at build time.
  Run it, then feed the output back as a graded column via **`races.ingestRace`** (real rows scored
  on the same grader). See [Sponsor integrations](#sponsor-integrations).

---

## API reference (public functions)

### Queries
| Function | Args | Returns |
|----------|------|---------|
| `categories.list` | — | category cards + top-tool teaser + tool count (Hub) |
| `categories.get` | `{ key }` | one category |
| `categories.globalTop` | `{ limit? }` | top tools across all categories (Hub strip) |
| `leaderboard.get` | `{ category, segment?, sort? }` | ranked rows; `sort ∈ quality\|affordability\|ease\|speed` (default quality) |
| `tools.list` | `{ category? }` | directory listing |
| `tools.getProfile` | `{ slug }` | one tool across categories + rank badges ("#1 Enrichment") |
| `battles.get` | `{ battleId }` | sanitized battle (no identities while open) |
| `races.getRace` | `{ raceId }` | race + cells + per-provider live scoreboard |
| `races.latest` | — | most recent running race id (or last) |
| `submissions.listPending` | — | pending tool submissions |

### Mutations
| Function | Args | Notes |
|----------|------|-------|
| `battles.next` | `{ category }` | creates a blind battle, returns anonymized outputs |
| `battles.castVote` | `{ battleId, result, voterId?, judgeType?, judgeModel? }` | `result ∈ A\|B\|tie\|bothBad`; updates Elo on overall + shared-segment boards; reveals identities. Identity-aware (Better Auth subject) when authenticated. |
| `races.createRace` | `{ name?, providerSlugs?, leads?, requestedFields?, useReal? }` | defaults to top-4 enrichment tools + built-in law-firm leads |
| `races.ingestRace` | `{ leads, results[], name?, requestedFields? }` | grade **real** provider output (Orange Slice / Fiber) |
| `submissions.submit` | `{ name, url?, category, note?, email? }` | sends a Resend receipt if configured |

### Actions
| Function | Args | Notes |
|----------|------|-------|
| `judge.judgeNext` | `{ category, model? }` | LLM judges a blind battle and casts a `judgeType=llm` vote (OpenAI; heuristic fallback) |
| `email.sendDigest` | `{ to, category, sort? }` | emails the top-5 leaderboard via Resend |

---

## Sponsor integrations

**Convex** — the whole backend: schema, reactive queries, mutations, actions, and the **scheduler**
that makes the RACE live. Best-use-of-Convex highlight: the enrichment race is pure Convex reactivity,
no websockets or client polling required.

**Orange Slice** (`npx orangeslice@latest`) — its `prospecting / enrichment / web_scraper / outreach`
toolkit runs in a Claude Code session. The demo flow: run Orange Slice on the law-firm leads, then
`races.ingestRace` the rows to score them live against the field. Orange Slice is also seeded as a
first-class enrichment contestant.

**Fiber AI** — real GTM data API wired in `convex/lib/enrich.ts`; set `FIBER_API_KEY` and pass
`useReal: true` to `createRace` to enrich against the live API.

---

## Configuration (Convex env vars)

Set these on the deployment (they are **not** in `.env.local`):

```bash
npx convex env set OPENAI_API_KEY   sk-...        # enables the real LLM judge (else heuristic)
npx convex env set OPENAI_JUDGE_MODEL gpt-4o-mini # optional
npx convex env set RESEND_API_KEY   re_...        # enables digest + submission receipts
npx convex env set RESEND_FROM      "GTM Arena <hello@yourdomain.com>"
npx convex env set FIBER_API_KEY    ...           # enables real Fiber enrichment in the race
```

---

## Frontend wiring

```bash
npm i convex
# .env.local (frontend):  NEXT_PUBLIC_CONVEX_URL=https://perfect-ptarmigan-440.convex.cloud
```

```tsx
// providers.tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
export const Providers = ({ children }) => (
  <ConvexProvider client={convex}>{children}</ConvexProvider>
);
```

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// 1 · Hub
const categories = useQuery(api.categories.list);
const topStrip   = useQuery(api.categories.globalTop, { limit: 8 });

// 2 · Battle  (blind → vote → reveal → next)
const next = useMutation(api.battles.next);
const vote = useMutation(api.battles.castVote);
// const b = await next({ category: "cold-email" });  // {battleId, task, contestants:[{label,output}]}
// const r = await vote({ battleId: b.battleId, result: "A" }); // r.reveal = identities + new Elo

// 3 · Enrichment Race  (live)
const createRace = useMutation(api.races.createRace);
const race = useQuery(api.races.getRace, raceId ? { raceId } : "skip"); // ticks live

// 4 · Leaderboard  (4 sort toggles + segment filter)
const rows = useQuery(api.leaderboard.get, { category, sort, segment });

// 5 · Tool Profile
const profile = useQuery(api.tools.getProfile, { slug });
```

**Palette the kernel expects:** BG `#FAFAFA`, text `#1A1A1A`, accent **Coral `#FF6F61`** (CTA / winner),
contestant identity colors Magenta `#C2185B` · Chartreuse `#D4C545` · Terracotta `#C77B57` · Mustard
`#FACF39` (used only as identity + chart marks).

### Authentication (Better Auth)

The backend is already **identity-aware**: `castVote` and `submit` attribute to
`ctx.auth.getUserIdentity()?.subject` when a request is authenticated, and fall back to an anonymous
session id otherwise. To turn it on, wire [Better Auth for Convex](https://labs.convex.dev/better-auth)
on the frontend (`@convex-dev/better-auth`) — register the component in `convex/convex.config.ts`, add
`convex/auth.ts`, and votes/submissions start attaching to real users with **no backend change**.

---

## Status & roadmap

- ✅ **Cold Email** + **Enrichment** fully built (battle samples / live race).
- ✅ Leaderboards for all 5 categories with the 4 sort dimensions + segment boards.
- ✅ LLM judge, real-results ingest, Resend digest, identity-aware writes.
- 🔜 Stubbed-deeper: **Email Context** & **Scraping** battles (seed boards live; add more samples),
  **Parallel Dialer** (seed board only).
- 🔜 Frontier scatter (cost × quality), full Better Auth component, sponsored / verified badges.

## Tech stack

Convex (DB · functions · scheduler · reactivity) · TypeScript · OpenAI (LLM judge) · Resend (email) ·
Fiber AI + Orange Slice (enrichment) · Better Auth (identity). Frontend: React · Next.js · Tailwind ·
shadcn/ui · Motion · Magic UI (scaffolded with `better-design`).

---

_Built with [Claude Code](https://claude.com/claude-code) for the AI Growth Hackathon._
