import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireUser,
  requireCommissioner,
  calculateAndApplyEventPoints,
} from "./helpers";

export const getActiveRounds = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("liveRounds")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", args.eventId).eq("status", "inProgress")
      )
      .collect();

    const withUsers = await Promise.all(
      rounds.map(async (round) => ({
        round,
        user: await ctx.db.get(round.userId),
      }))
    );

    return withUsers;
  },
});

export const getLiveLeaderboard = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("liveRounds")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Only include active and completed rounds
    const relevantRounds = rounds.filter(
      (r) => r.status === "inProgress" || r.status === "completed"
    );

    const withUsers = await Promise.all(
      relevantRounds.map(async (round) => ({
        round,
        user: await ctx.db.get(round.userId),
      }))
    );

    // Sort by relToPar ascending, then by currentHole descending (further along breaks ties)
    return withUsers.sort((a, b) => {
      if (a.round.relToPar !== b.round.relToPar) {
        return a.round.relToPar - b.round.relToPar;
      }
      return b.round.currentHole - a.round.currentHole;
    });
  },
});

export const getRoundHoleScores = query({
  args: { liveRoundId: v.id("liveRounds") },
  handler: async (ctx, args) => {
    const holeScores = await ctx.db
      .query("holeScores")
      .withIndex("by_round", (q) => q.eq("liveRoundId", args.liveRoundId))
      .collect();

    return holeScores.sort((a, b) => a.holeNumber - b.holeNumber);
  },
});

export const startRound = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status !== "active") throw new Error("Event is not active");

    // Check for existing active round
    const existingRounds = await ctx.db
      .query("liveRounds")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    const activeRound = existingRounds.find(
      (r) => r.userId === user._id && r.status !== "completed" && r.status !== "withdrawn"
    );
    if (activeRound) throw new Error("Round already started for this event");

    return await ctx.db.insert("liveRounds", {
      eventId: args.eventId,
      userId: user._id,
      status: "inProgress",
      currentHole: 1,
      totalScore: 0,
      relToPar: 0,
      startedAt: Date.now(),
    });
  },
});

export const submitHoleScore = mutation({
  args: {
    liveRoundId: v.id("liveRounds"),
    holeNumber: v.number(),
    score: v.number(),
    par: v.number(),
    pickedUp: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const round = await ctx.db.get(args.liveRoundId);
    if (!round) throw new Error("Round not found");
    if (round.userId !== user._id) throw new Error("Not your round");
    if (round.status !== "inProgress") throw new Error("Round is not in progress");
    if (args.holeNumber !== round.currentHole) {
      throw new Error(
        `Expected hole ${round.currentHole}, received ${args.holeNumber}`
      );
    }

    const relToPar = args.score - args.par;

    // Check for existing hole score (upsert)
    const existingHole = await ctx.db
      .query("holeScores")
      .withIndex("by_round_hole", (q) =>
        q.eq("liveRoundId", args.liveRoundId).eq("holeNumber", args.holeNumber)
      )
      .unique();

    if (existingHole) {
      await ctx.db.patch(existingHole._id, {
        score: args.score,
        par: args.par,
        relToPar,
        pickedUp: args.pickedUp,
      });
    } else {
      await ctx.db.insert("holeScores", {
        liveRoundId: args.liveRoundId,
        holeNumber: args.holeNumber,
        par: args.par,
        score: args.score,
        relToPar,
        pickedUp: args.pickedUp,
      });
    }

    // Advance current hole and update running totals
    await ctx.db.patch(args.liveRoundId, {
      currentHole: round.currentHole + 1,
      totalScore: round.totalScore + args.score,
      relToPar: round.relToPar + relToPar,
    });
  },
});

export const completeRound = mutation({
  args: { liveRoundId: v.id("liveRounds") },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const round = await ctx.db.get(args.liveRoundId);
    if (!round) throw new Error("Round not found");
    if (round.status !== "inProgress") throw new Error("Round is not in progress");

    // Fetch all hole scores for this round
    const holeScores = await ctx.db
      .query("holeScores")
      .withIndex("by_round", (q) => q.eq("liveRoundId", args.liveRoundId))
      .collect();

    // Aggregate stats
    let gross = 0;
    let birdies = 0;
    let eagles = 0;
    let pars = 0;
    let bogeys = 0;
    let doublePlus = 0;
    let pickups = 0;

    for (const hs of holeScores) {
      gross += hs.score;
      if (hs.pickedUp) {
        pickups++;
      } else if (hs.relToPar <= -2) {
        eagles++;
      } else if (hs.relToPar === -1) {
        birdies++;
      } else if (hs.relToPar === 0) {
        pars++;
      } else if (hs.relToPar === 1) {
        bogeys++;
      } else {
        doublePlus++;
      }
    }

    // Get user handicap
    const user = await ctx.db.get(round.userId);
    const handicap = user?.handicap ?? 0;
    const net = gross - handicap;

    // Mark round as completed
    await ctx.db.patch(args.liveRoundId, {
      status: "completed" as const,
      completedAt: Date.now(),
    });

    // Write to scores table
    await ctx.db.insert("scores", {
      eventId: round.eventId,
      userId: round.userId,
      gross,
      net,
      handicap,
      birdies,
      eagles,
      pars,
      bogeys,
      doublePlus,
      pickups,
      pointsEarned: 0,
      finishPosition: 0,
    });

    // Check if ALL rounds for this event are done
    const allRounds = await ctx.db
      .query("liveRounds")
      .withIndex("by_event", (q) => q.eq("eventId", round.eventId))
      .collect();

    const allDone = allRounds.every(
      (r) => r.status === "completed" || r.status === "withdrawn"
    );

    if (allDone) {
      await calculateAndApplyEventPoints(ctx, round.eventId);
    }
  },
});
