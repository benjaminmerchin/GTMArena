import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// ────────────────────────────────────────────────────────────────────────────
// LLM judge — the "LLMs vote too" half of the arena (designarena.ai logic).
// Judges a blind A/B battle with an LLM and casts a real vote (judgeType=llm),
// feeding Elo exactly like a human vote. Falls back to a transparent heuristic
// when OPENAI_API_KEY is unset, so the feature always demos.
//   npx convex env set OPENAI_API_KEY sk-...
// ────────────────────────────────────────────────────────────────────────────

type Verdict = { winner: "A" | "B" | "tie" | "bothBad"; rationale: string };

function heuristicJudge(a: string, b: string): Verdict {
  const score = (o: string) => {
    let s = 0;
    if (/subject:/i.test(o)) s += 1; // has a subject line
    if (/\?/.test(o)) s += 1; // asks for the meeting / has a CTA
    if (o.split(/\s+/).length <= 90) s += 1; // concise
    if (/\{\{|congrat|saw |noticed|your |you'?re/i.test(o)) s += 1; // personalized
    return s;
  };
  const sa = score(a);
  const sb = score(b);
  if (sa === sb) return { winner: "tie", rationale: `Heuristic tie (${sa} vs ${sb}).` };
  return {
    winner: sa > sb ? "A" : "B",
    rationale: `Heuristic: ${sa} vs ${sb} on subject/CTA/brevity/personalization.`,
  };
}

async function llmJudge(
  model: string,
  key: string,
  task: string,
  a: string,
  b: string,
): Promise<Verdict | null> {
  const system =
    "You are an expert GTM operator judging a blind A/B test of two tool outputs " +
    "for the same task. Be decisive. Weigh quality, relevance, concision, and the " +
    "likelihood of getting a positive reply. Never assume the tools' identities.";
  const user =
    `TASK:\n${task}\n\nOUTPUT A:\n${a}\n\nOUTPUT B:\n${b}\n\n` +
    `Respond as JSON: {"winner":"A"|"B"|"tie"|"bothBad","rationale":"one sentence"}`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error(`[judge] OpenAI ${res.status}: ${await res.text()}`);
      return null;
    }
    const data: any = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (!["A", "B", "tie", "bothBad"].includes(parsed.winner)) return null;
    return { winner: parsed.winner, rationale: String(parsed.rationale ?? "") };
  } catch (e) {
    console.error("[judge]", e);
    return null;
  }
}

// Pull a fresh blind battle for a category, judge it with an LLM, cast the vote,
// and return the verdict + reveal.
export const judgeNext = action({
  args: { category: v.string(), model: v.optional(v.string()) },
  handler: async (ctx, { category, model }) => {
    const battle = await ctx.runMutation(api.battles.next, { category });
    const a = battle.contestants.find((c) => c.label === "A")?.output ?? "";
    const b = battle.contestants.find((c) => c.label === "B")?.output ?? "";

    const key = process.env.OPENAI_API_KEY;
    const requested = model ?? process.env.OPENAI_JUDGE_MODEL ?? "gpt-4o-mini";

    let verdict = key ? await llmJudge(requested, key, battle.task, a, b) : null;
    const usedModel = verdict ? requested : "heuristic-v1";
    if (!verdict) verdict = heuristicJudge(a, b);

    const result = await ctx.runMutation(api.battles.castVote, {
      battleId: battle.battleId,
      result: verdict.winner,
      judgeType: "llm",
      judgeModel: usedModel,
    });

    return {
      battleId: battle.battleId,
      task: battle.task,
      model: usedModel,
      winner: verdict.winner,
      rationale: verdict.rationale,
      reveal: result.reveal,
    };
  },
});
