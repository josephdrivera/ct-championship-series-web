/**
 * Player directory: all public queries (no auth required).
 * Lists, profiles with aggregated stats, and head-to-head records.
 */
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAllPlayers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getPlayersWithStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const allScores = await ctx.db.query("scores").collect();

    const eventsMap = new Map<string, number>();
    for (const score of allScores) {
      eventsMap.set(
        score.userId as string,
        (eventsMap.get(score.userId as string) ?? 0) + 1
      );
    }

    return users
      .map((u) => ({ ...u, eventsPlayed: eventsMap.get(u._id as string) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getPlayerProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Fetch all scores for this user
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Aggregate stats
    const totalPoints = scores.reduce((sum, s) => sum + s.pointsEarned, 0);
    const avgScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.gross, 0) / scores.length
        : 0;
    const wins = scores.filter((s) => s.finishPosition === 1).length;
    const birdies = scores.reduce((sum, s) => sum + s.birdies, 0);
    const eventsPlayed = scores.length;

    // Recent scores: join with events and courses, sorted by event date
    const scoresWithEvents = await Promise.all(
      scores.map(async (score) => {
        const event = await ctx.db.get(score.eventId);
        const course = event ? await ctx.db.get(event.courseId) : null;
        return { score, event, course };
      })
    );

    const recentScores = scoresWithEvents
      .filter((s) => s.event !== null)
      .sort((a, b) => b.event!.date.localeCompare(a.event!.date))
      .slice(0, 5);

    // Fetch achievements
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      user,
      stats: { totalPoints, avgScore, wins, birdies, eventsPlayed },
      recentScores,
      achievements,
    };
  },
});

export const getHeadToHead = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Normalize ordering for consistent index lookup
    const [canonicalId1, canonicalId2] =
      args.userId1 < args.userId2
        ? [args.userId1, args.userId2]
        : [args.userId2, args.userId1];
    const swapped = args.userId1 > args.userId2;

    const records = await ctx.db
      .query("headToHead")
      .withIndex("by_matchup", (q) =>
        q.eq("userId1", canonicalId1).eq("userId2", canonicalId2)
      )
      .collect();

    // Aggregate totals
    let totalWins1 = 0;
    let totalWins2 = 0;
    let totalTies = 0;
    for (const r of records) {
      totalWins1 += r.wins1;
      totalWins2 += r.wins2;
      totalTies += r.ties;
    }

    // Swap back if needed so results match the caller's perspective
    if (swapped) {
      [totalWins1, totalWins2] = [totalWins2, totalWins1];
    }

    const [user1, user2] = await Promise.all([
      ctx.db.get(args.userId1),
      ctx.db.get(args.userId2),
    ]);

    return {
      user1,
      user2,
      totalWins1,
      totalWins2,
      totalTies,
      records: records.map((r) => ({
        ...r,
        wins1: swapped ? r.wins2 : r.wins1,
        wins2: swapped ? r.wins1 : r.wins2,
      })),
    };
  },
});
