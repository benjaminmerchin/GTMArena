// Tiny OpenAI JSON helper shared by the ranker, recommender, and judge.
// Returns parsed JSON (object) or null when the key is missing / call fails.
export async function chatJSON(
  model: string,
  system: string,
  user: string,
): Promise<any | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    // Note: no `temperature` — GPT-5 reasoning models only accept the default.
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error(`[openai] ${res.status}: ${await res.text()}`);
      return null;
    }
    const data: any = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch (e) {
    console.error("[openai]", e);
    return null;
  }
}

// Ranking is done by GPT-5.5 (override with `npx convex env set OPENAI_RANK_MODEL ...`).
export const rankModel = () => process.env.OPENAI_RANK_MODEL ?? "gpt-5.5";
export const classifyModel = () => process.env.OPENAI_CLASSIFY_MODEL ?? "gpt-5.5";

// GPT-5.5 with live web search (Responses API). Returns parsed JSON from the
// model's answer (it's prompted to reply with one JSON object).
export async function webSearchJSON(
  prompt: string,
  model = rankModel(),
): Promise<any | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, tools: [{ type: "web_search" }], input: prompt }),
    });
    if (!res.ok) {
      console.error(`[search] ${res.status}: ${await res.text()}`);
      return null;
    }
    const data: any = await res.json();
    let text = "";
    for (const o of data.output ?? []) {
      if (o.type === "message")
        for (const c of o.content ?? []) if (c.type === "output_text") text += c.text;
    }
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.error("[search]", e);
    return null;
  }
}

// TokenRouter — one OpenAI-compatible endpoint for many providers' models.
// Used to judge battles with a rotation of cheap models. Parses JSON from the
// reply text (no response_format/temperature, for cross-model robustness).
export async function tokenRouterJSON(
  model: string,
  system: string,
  user: string,
): Promise<any | null> {
  const key = process.env.TOKENROUTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tokenrouter.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`[tokenrouter] ${model} ${res.status}: ${await res.text()}`);
      return null;
    }
    const data: any = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.error("[tokenrouter]", e);
    return null;
  }
}
