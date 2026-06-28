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
