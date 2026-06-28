import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// "Product Hunt for agent tools" — anyone can submit a tool for review.
export const submit = mutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    category: v.string(),
    note: v.optional(v.string()),
    submittedBy: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = args.email ?? identity?.email;
    const id = await ctx.db.insert("submissions", {
      ...args,
      submittedBy: identity?.subject ?? args.submittedBy,
      email,
      status: "pending",
      createdAt: Date.now(),
    });
    // Fire a confirmation email if Resend is configured (no-op otherwise).
    if (email) {
      await ctx.scheduler.runAfter(0, internal.email.sendSubmissionReceipt, {
        email,
        name: args.name,
      });
    }
    return id;
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});
