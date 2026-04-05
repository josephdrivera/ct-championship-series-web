/**
 * Hall of Fame / history: all public queries (no auth required).
 * Champion cards, major winners, and all-time stat records.
 */
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getChampionCards = query({
  args: {},
  handler: async (ctx) => {
    const completedSeasons = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    const results = await Promise.all(
      completedSeasons.map(async (season) => {
        const champion = season.championId
          ? await ctx.db.get(season.championId)
          : null;

        let championStanding = null;
        if (season.championId) {
          const standings = await ctx.db
            .query("standings")
            .withIndex("by_season", (q) => q.eq("seasonId", season._id))
            .collect();
          championStanding =
            standings.find((s) => s.userId === season.championId) ?? null;
        }

        const events = await ctx.db
          .query("events")
          .withIndex("by_season", (q) => q.eq("seasonId", season._id))
          .collect();
        const completedEventCount = events.filter(
          (e) => e.status === "completed"
        ).length;

        return {
          season: {
            year: season.year,
            name: season.name,
            _id: season._id,
          },
          champion: champion
            ? { name: champion.name, photo: champion.photo }
            : null,
          standing: championStanding
            ? {
                totalPoints: championStanding.totalPoints,
                wins: championStanding.wins,
                eventsPlayed: championStanding.eventsPlayed,
                scoringAverage: championStanding.scoringAverage,
              }
            : null,
          completedEvents: completedEventCount,
        };
      })
    );

    return results.sort((a, b) => b.season.year - a.season.year);
  },
});

export const getMajorWinners = query({
  args: {},
  handler: async (ctx) => {
    const completedSeasons = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    const seasonIds = new Set(completedSeasons.map((s) => s._id));

    const completedEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    const majorEvents = completedEvents.filter(
      (e) => e.isMajor && seasonIds.has(e.seasonId)
    );

    const results = await Promise.all(
      majorEvents.map(async (event) => {
        const scores = await ctx.db
          .query("scores")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        const winnerScore = scores.find((s) => s.finishPosition === 1);
        if (!winnerScore) return null;

        const [user, course, season] = await Promise.all([
          ctx.db.get(winnerScore.userId),
          ctx.db.get(event.courseId),
          ctx.db.get(event.seasonId),
        ]);

        return {
          event: { name: event.name, date: event.date },
          course: course ? { name: course.name, par: course.par } : null,
          season: season ? { year: season.year } : null,
          winner: user ? { name: user.name, photo: user.photo } : null,
          score: { gross: winnerScore.gross, net: winnerScore.net },
        };
      })
    );

    return results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.event.date.localeCompare(a.event.date));
  },
});

export const getAllTimeRecords = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query("scores").collect();
    const allStandings = await ctx.db.query("standings").collect();

    // Most Career Wins
    const winsByUser = new Map<string, number>();
    for (const score of allScores) {
      if (score.finishPosition === 1) {
        const key = score.userId as string;
        winsByUser.set(key, (winsByUser.get(key) || 0) + 1);
      }
    }
    let mostWinsUserId: string | null = null;
    let mostWinsCount = 0;
    for (const [userId, count] of winsByUser) {
      if (count > mostWinsCount) {
        mostWinsCount = count;
        mostWinsUserId = userId;
      }
    }

    // Lowest Single Round (gross)
    let lowestScore: (typeof allScores)[number] | null = null;
    for (const score of allScores) {
      if (!lowestScore || score.gross < lowestScore.gross) {
        lowestScore = score;
      }
    }
    let lowestRoundContext: {
      gross: number;
      event: { name: string; date: string } | null;
      course: { name: string; par: number } | null;
    } | null = null;
    if (lowestScore) {
      const event = await ctx.db.get(lowestScore.eventId);
      const course = event ? await ctx.db.get(event.courseId) : null;
      lowestRoundContext = {
        gross: lowestScore.gross,
        event: event ? { name: event.name, date: event.date } : null,
        course: course ? { name: course.name, par: course.par } : null,
      };
    }

    // Most Points in a Single Season
    let topStanding: (typeof allStandings)[number] | null = null;
    for (const standing of allStandings) {
      if (!topStanding || standing.totalPoints > topStanding.totalPoints) {
        topStanding = standing;
      }
    }
    let topSeasonContext: {
      totalPoints: number;
      season: { year: number; name: string } | null;
    } | null = null;
    if (topStanding) {
      const season = await ctx.db.get(topStanding.seasonId);
      topSeasonContext = {
        totalPoints: topStanding.totalPoints,
        season: season ? { year: season.year, name: season.name } : null,
      };
    }

    // Most Career Birdies
    const birdiesByUser = new Map<string, number>();
    for (const score of allScores) {
      const key = score.userId as string;
      birdiesByUser.set(key, (birdiesByUser.get(key) || 0) + score.birdies);
    }
    let mostBirdiesUserId: string | null = null;
    let mostBirdiesCount = 0;
    for (const [userId, count] of birdiesByUser) {
      if (count > mostBirdiesCount) {
        mostBirdiesCount = count;
        mostBirdiesUserId = userId;
      }
    }

    // Resolve user data
    const [winsUser, lowestRoundUser, topPointsUser, birdiesUser] =
      await Promise.all([
        mostWinsUserId
          ? ctx.db.get(mostWinsUserId as Id<"users">)
          : null,
        lowestScore ? ctx.db.get(lowestScore.userId) : null,
        topStanding ? ctx.db.get(topStanding.userId) : null,
        mostBirdiesUserId
          ? ctx.db.get(mostBirdiesUserId as Id<"users">)
          : null,
      ]);

    return {
      mostWins: {
        user: winsUser ? { name: winsUser.name, photo: winsUser.photo } : null,
        count: mostWinsCount,
      },
      lowestRound: {
        user: lowestRoundUser
          ? { name: lowestRoundUser.name, photo: lowestRoundUser.photo }
          : null,
        ...(lowestRoundContext ?? { gross: 0, event: null, course: null }),
      },
      mostSeasonPoints: {
        user: topPointsUser
          ? { name: topPointsUser.name, photo: topPointsUser.photo }
          : null,
        ...(topSeasonContext ?? { totalPoints: 0, season: null }),
      },
      mostBirdies: {
        user: birdiesUser
          ? { name: birdiesUser.name, photo: birdiesUser.photo }
          : null,
        count: mostBirdiesCount,
      },
    };
  },
});
