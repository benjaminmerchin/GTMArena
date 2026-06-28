import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Resolve the current user from a stored id (robust to stale/invalid ids).
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const id = ctx.db.normalizeId("users", userId);
    if (!id) return null;
    const u = await ctx.db.get(id);
    return u ? { _id: u._id, name: u.name, email: u.email } : null;
  },
});

// ── magic-link sign-in (passwordless, via Resend) ───────────────────────────

function newToken() {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

const magicEmail = (url: string) => `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0B1F3A">
    <div style="font-weight:700;font-size:18px">🏛️ GTM Arena</div>
    <h2 style="font-size:20px;margin:18px 0 6px">Your sign-in link</h2>
    <p style="color:#555;line-height:1.5">Click below to sign in. This link works once and expires in 15 minutes.</p>
    <a href="${url}" style="display:inline-block;margin:14px 0;background:#2F6FED;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:600">Sign in to GTM Arena</a>
    <p style="color:#999;font-size:12px;margin-top:18px">If you didn't request this, you can ignore this email.</p>
  </div>`;

// Generate a one-time token, store it, and email the link. Returns {sent} —
// or {sent:false, url} so the demo still works if Resend isn't configured.
export const requestMagicLink = action({
  args: { email: v.string(), origin: v.string() },
  handler: async (ctx, { email, origin }) => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) throw new Error("Enter a valid email");

    const token = newToken();
    await ctx.runMutation(internal.users.storeMagicLink, {
      email: e,
      token,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    const url = `${origin.replace(/\/$/, "")}/auth/verify?token=${token}`;

    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "GTM Arena <onboarding@resend.dev>";
    if (!key) return { sent: false as const, url };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: e,
          subject: "Your GTM Arena sign-in link",
          html: magicEmail(url),
        }),
      });
      if (!res.ok) {
        console.error(`[magic] Resend ${res.status}: ${await res.text()}`);
        return { sent: false as const, url };
      }
      return { sent: true as const };
    } catch (err) {
      console.error("[magic]", err);
      return { sent: false as const, url };
    }
  },
});

export const storeMagicLink = internalMutation({
  args: { email: v.string(), token: v.string(), expiresAt: v.number() },
  handler: async (ctx, a) => {
    await ctx.db.insert("magicLinks", { ...a, used: false, createdAt: Date.now() });
  },
});

// Validate a token (single-use, unexpired), upsert the user, return the session.
export const verifyMagicLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const link = await ctx.db
      .query("magicLinks")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!link) throw new Error("Invalid sign-in link");
    if (link.used) throw new Error("This link was already used");
    if (link.expiresAt < Date.now()) throw new Error("This link has expired");

    await ctx.db.patch(link._id, { used: true });

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", link.email))
      .unique();
    const userId = existing
      ? existing._id
      : await ctx.db.insert("users", {
          email: link.email,
          name: link.email.split("@")[0],
          createdAt: Date.now(),
        });
    const u = (await ctx.db.get(userId))!;
    return { _id: u._id, name: u.name, email: u.email };
  },
});
