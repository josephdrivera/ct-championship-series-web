import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCommissioner } from "./helpers";

export const getActiveSeason = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();
  },
});

export const getChampionHistory = query({
  args: {},
  handler: async (ctx) => {
    const completedSeasons = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    const results = await Promise.all(
      completedSeasons.map(async (season) => ({
        season,
        champion: season.championId
          ? await ctx.db.get(season.championId)
          : null,
      }))
    );

    return results.sort((a, b) => b.season.year - a.season.year);
  },
});

export const createSeason = mutation({
  args: {
    year: v.number(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const existing = await ctx.db
      .query("seasons")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .first();
    if (existing) throw new Error(`Season for year ${args.year} already exists`);

    return await ctx.db.insert("seasons", {
      year: args.year,
      name: args.name,
      status: "upcoming",
    });
  },
});
