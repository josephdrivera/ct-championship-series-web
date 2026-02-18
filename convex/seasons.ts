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

export const getAllSeasons = query({
  args: {},
  handler: async (ctx) => {
    const seasons = await ctx.db.query("seasons").collect();
    return seasons.sort((a, b) => b.year - a.year);
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

export const updateSeason = mutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("upcoming"),
        v.literal("active"),
        v.literal("completed")
      )
    ),
    championId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const season = await ctx.db.get(args.seasonId);
    if (!season) throw new Error("Season not found");

    const { seasonId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.championId !== undefined) patch.championId = updates.championId;

    await ctx.db.patch(seasonId, patch);
  },
});

export const toggleLiveMode = mutation({
  args: {
    seasonId: v.id("seasons"),
    liveOverride: v.optional(v.union(v.literal("on"), v.literal("off"))),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const season = await ctx.db.get(args.seasonId);
    if (!season) throw new Error("Season not found");

    await ctx.db.patch(args.seasonId, {
      liveOverride: args.liveOverride,
    });
  },
});
