/**
 * Site-wide presence: heartbeats while a session is active, public read for
 * “who’s online” (recent heartbeat). Avoids Date.now() in queries — clients
 * filter by age using local clock ticks.
 */
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: now });
      return existing._id;
    }

    return await ctx.db.insert("presence", {
      userId: user._id,
      lastSeenAt: now,
    });
  },
});

export const listPresence = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("presence").collect();
    const withUsers = await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        if (!user || user.isSuspended) return null;
        return { lastSeenAt: row.lastSeenAt, user };
      })
    );
    return withUsers.filter((x): x is NonNullable<typeof x> => x !== null);
  },
});
