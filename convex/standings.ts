import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCommissioner, recalculateStandings } from "./helpers";

export const getSeasonStandings = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_season_rank", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const withUsers = await Promise.all(
      standings.map(async (standing) => ({
        standing,
        user: await ctx.db.get(standing.userId),
      }))
    );

    return withUsers.sort((a, b) => a.standing.rank - b.standing.rank);
  },
});

export const updateStandings = mutation({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);
    await recalculateStandings(ctx, args.seasonId);
  },
});
