import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";

// Email via Resend's REST API. No-op (logs) if RESEND_API_KEY is unset, so the
// rest of the app works without credentials. Set in the Convex deployment env:
//   npx convex env set RESEND_API_KEY re_xxx
//   npx convex env set RESEND_FROM "GTM Arena <hello@yourdomain.com>"
async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "GTM Arena <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email] RESEND_API_KEY not set — skipping "${subject}" → ${to}`);
    return { skipped: true as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[email] Resend error ${res.status}: ${text}`);
    return { ok: false as const, status: res.status };
  }
  return { ok: true as const, id: (await res.json()).id as string };
}

const shell = (title: string, body: string) => `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
    <div style="font-weight:700;font-size:18px;border-bottom:1px solid #eee;padding-bottom:12px">
      🏟️ GTM Arena
    </div>
    <h2 style="font-size:20px;margin:20px 0 8px">${title}</h2>
    ${body}
    <div style="color:#888;font-size:12px;margin-top:28px;border-top:1px solid #eee;padding-top:12px">
      Find the best low-level tools for your GTM stack — ranked by the crowd and by LLMs.
    </div>
  </div>`;

export const sendSubmissionReceipt = internalAction({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (_ctx, { email, name }) => {
    return await sendEmail(
      email,
      "We got your tool submission 🏟️",
      shell(
        "Thanks for the submission!",
        `<p>We received <b>${name ?? "your tool"}</b> and our curators (human + LLM) will benchmark it into the Arena soon.</p>`,
      ),
    );
  },
});

// Leaderboard digest — renders the top tools of a category and emails it.
export const sendDigest = action({
  args: {
    to: v.string(),
    category: v.string(),
    sort: v.optional(
      v.union(
        v.literal("quality"),
        v.literal("affordability"),
        v.literal("ease"),
        v.literal("speed"),
      ),
    ),
  },
  handler: async (ctx, { to, category, sort }) => {
    const cat = await ctx.runQuery(api.categories.get, { key: category });
    const rows = await ctx.runQuery(api.leaderboard.get, {
      category,
      sort: sort ?? "quality",
    });
    const top = rows.slice(0, 5);
    const list = top
      .map(
        (r: any) =>
          `<tr>
             <td style="padding:6px 10px;color:#888">#${r.rank}</td>
             <td style="padding:6px 10px;font-weight:600">${r.name}</td>
             <td style="padding:6px 10px;color:#FF6F61">Elo ${r.elo}</td>
             <td style="padding:6px 10px;color:#555">$${r.cost}${r.costUnit} · Ease ${r.easeScore} · ${(r.speedMs / 1000).toFixed(1)}s</td>
           </tr>`,
      )
      .join("");
    return await sendEmail(
      to,
      `Best ${cat?.name ?? category} tools for AI agents`,
      shell(
        `Top ${cat?.name ?? category} tools`,
        `<table style="width:100%;border-collapse:collapse;font-size:14px">${list}</table>`,
      ),
    );
  },
});
