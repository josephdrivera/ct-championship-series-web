import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const fetchAllSubscriptions = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  },
});

export const removeStaleSubscription = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (sub) {
      await ctx.db.delete(sub._id);
    }
  },
});
