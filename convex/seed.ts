import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  calculateAndApplyEventPoints,
} from "./helpers";

/**
 * Seeds the database with comprehensive 2026 CT Championship Series test data.
 * Run via CLI: npx convex run seed:seedData
 *
 * Creates:
 * - 8 CT courses (3 with full 18-hole data)
 * - 8 seed players with realistic profiles and handicaps (10-24)
 * - 1 active season with 3 completed events, 1 active event, 4 upcoming events
 * - Scores, standings, and points for completed events
 * - Live rounds at different holes for the active event
 * - Achievement records for event winners
 * - Head-to-head records
 * - Sample chat messages
 */
export const seedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // --- Idempotency check ---
    const existingCourses = await ctx.db.query("courses").collect();
    if (existingCourses.length > 0) {
      throw new Error(
        "Database already has data. Run seed:clearData first if you want to re-seed."
      );
    }

    // ==========================================
    // 1. COURSES
    // ==========================================
    const courseData = [
      { name: "Keney Park Golf Course", par: 72, holes: 18, location: "Hartford, CT" },
      { name: "Shennecossett Golf Course", par: 71, holes: 18, location: "Groton, CT" },
      { name: "Oxford Greens Golf Club", par: 72, holes: 18, location: "Oxford, CT" },
      { name: "Wintonbury Hills Golf Course", par: 72, holes: 18, location: "Bloomfield, CT" },
      { name: "Blackledge CC - Anderson Course", par: 72, holes: 18, location: "Hebron, CT" },
      { name: "Great River Golf Club", par: 72, holes: 18, location: "Milford, CT" },
      { name: "Fox Hopyard Golf Club", par: 71, holes: 18, location: "East Haddam, CT" },
      { name: "Lake of Isles - North Course", par: 72, holes: 18, location: "North Stonington, CT" },
    ];

    const courseIds: Id<"courses">[] = [];
    for (const course of courseData) {
      courseIds.push(await ctx.db.insert("courses", course));
    }

    // ==========================================
    // 2. COURSE HOLES (3 courses with full 18-hole data)
    // ==========================================

    // Keney Park Golf Course — Par 72
    const keneyHoles = [
      { holeNumber: 1, par: 4, yardage: 385 },
      { holeNumber: 2, par: 3, yardage: 165 },
      { holeNumber: 3, par: 5, yardage: 510 },
      { holeNumber: 4, par: 4, yardage: 370 },
      { holeNumber: 5, par: 4, yardage: 405 },
      { holeNumber: 6, par: 3, yardage: 175 },
      { holeNumber: 7, par: 4, yardage: 360 },
      { holeNumber: 8, par: 5, yardage: 490 },
      { holeNumber: 9, par: 4, yardage: 415 },
      { holeNumber: 10, par: 4, yardage: 380 },
      { holeNumber: 11, par: 4, yardage: 395 },
      { holeNumber: 12, par: 3, yardage: 155 },
      { holeNumber: 13, par: 5, yardage: 520 },
      { holeNumber: 14, par: 4, yardage: 350 },
      { holeNumber: 15, par: 4, yardage: 410 },
      { holeNumber: 16, par: 3, yardage: 180 },
      { holeNumber: 17, par: 5, yardage: 505 },
      { holeNumber: 18, par: 4, yardage: 386 },
    ];
    for (const hole of keneyHoles) {
      await ctx.db.insert("courseHoles", { courseId: courseIds[0], ...hole });
    }

    // Shennecossett Golf Course — Par 71
    const shennecossettHoles = [
      { holeNumber: 1, par: 4, yardage: 375 },
      { holeNumber: 2, par: 4, yardage: 390 },
      { holeNumber: 3, par: 3, yardage: 170 },
      { holeNumber: 4, par: 5, yardage: 495 },
      { holeNumber: 5, par: 4, yardage: 365 },
      { holeNumber: 6, par: 4, yardage: 400 },
      { holeNumber: 7, par: 3, yardage: 160 },
      { holeNumber: 8, par: 4, yardage: 345 },
      { holeNumber: 9, par: 5, yardage: 485 },
      { holeNumber: 10, par: 4, yardage: 370 },
      { holeNumber: 11, par: 3, yardage: 145 },
      { holeNumber: 12, par: 4, yardage: 380 },
      { holeNumber: 13, par: 5, yardage: 510 },
      { holeNumber: 14, par: 4, yardage: 355 },
      { holeNumber: 15, par: 4, yardage: 395 },
      { holeNumber: 16, par: 3, yardage: 185 },
      { holeNumber: 17, par: 4, yardage: 360 },
      { holeNumber: 18, par: 4, yardage: 327 },
    ];
    for (const hole of shennecossettHoles) {
      await ctx.db.insert("courseHoles", { courseId: courseIds[1], ...hole });
    }

    // Wintonbury Hills Golf Course — Par 72 (active event course)
    const wintonburyHoles = [
      { holeNumber: 1, par: 4, yardage: 390 },
      { holeNumber: 2, par: 3, yardage: 175 },
      { holeNumber: 3, par: 5, yardage: 515 },
      { holeNumber: 4, par: 4, yardage: 365 },
      { holeNumber: 5, par: 4, yardage: 410 },
      { holeNumber: 6, par: 3, yardage: 185 },
      { holeNumber: 7, par: 4, yardage: 355 },
      { holeNumber: 8, par: 5, yardage: 500 },
      { holeNumber: 9, par: 4, yardage: 420 },
      { holeNumber: 10, par: 4, yardage: 375 },
      { holeNumber: 11, par: 4, yardage: 400 },
      { holeNumber: 12, par: 3, yardage: 160 },
      { holeNumber: 13, par: 5, yardage: 525 },
      { holeNumber: 14, par: 4, yardage: 345 },
      { holeNumber: 15, par: 4, yardage: 405 },
      { holeNumber: 16, par: 3, yardage: 170 },
      { holeNumber: 17, par: 5, yardage: 510 },
      { holeNumber: 18, par: 4, yardage: 380 },
    ];
    for (const hole of wintonburyHoles) {
      await ctx.db.insert("courseHoles", { courseId: courseIds[3], ...hole });
    }

    // ==========================================
    // 3. SEED PLAYERS
    // ==========================================
    const players = [
      { clerkId: "seed_player_1", name: "Mike Sullivan", handicap: 12, joinedYear: 2024, isCommissioner: true, isSuperAdmin: true },
      { clerkId: "seed_player_2", name: "Dave Chen", handicap: 10, joinedYear: 2024, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_3", name: "Tom Barrett", handicap: 18, joinedYear: 2025, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_4", name: "Chris Morales", handicap: 15, joinedYear: 2024, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_5", name: "Ryan O'Brien", handicap: 20, joinedYear: 2025, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_6", name: "James Park", handicap: 14, joinedYear: 2024, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_7", name: "Nick DeLuca", handicap: 22, joinedYear: 2025, isCommissioner: false, isSuperAdmin: false },
      { clerkId: "seed_player_8", name: "Brian Walsh", handicap: 24, joinedYear: 2025, isCommissioner: false, isSuperAdmin: false },
    ];

    const userIds: Id<"users">[] = [];
    for (const player of players) {
      userIds.push(await ctx.db.insert("users", player));
    }

    // Player index reference:
    // 0=Sullivan(12), 1=Chen(10), 2=Barrett(18), 3=Morales(15),
    // 4=O'Brien(20), 5=Park(14), 6=DeLuca(22), 7=Walsh(24)

    // ==========================================
    // 4. SEASON
    // ==========================================
    const seasonId = await ctx.db.insert("seasons", {
      year: 2026,
      name: "The Connecticut Eight-Month Open",
      status: "active",
    });

    // ==========================================
    // 5. EVENTS
    // ==========================================
    // Events 1-3: inserted as "upcoming", calculateAndApplyEventPoints will flip to "completed"
    // Event 4: "active" (live event)
    // Events 5-8: "upcoming"
    const eventDefs = [
      { name: "April at Keney Park", courseIdx: 0, date: "2026-04-18", format: "stroke" as const, isMajor: false, eventNumber: 1, status: "upcoming" as const },
      { name: "May at Shennecossett", courseIdx: 1, date: "2026-05-16", format: "stroke" as const, isMajor: false, eventNumber: 2, status: "upcoming" as const },
      { name: "June at Oxford Greens", courseIdx: 2, date: "2026-06-20", format: "stroke" as const, isMajor: false, eventNumber: 3, status: "upcoming" as const },
      { name: "July at Wintonbury Hills", courseIdx: 3, date: "2026-07-18", format: "stroke" as const, isMajor: false, eventNumber: 4, status: "active" as const },
      { name: "August at Blackledge", courseIdx: 4, date: "2026-08-15", format: "stroke" as const, isMajor: true, eventNumber: 5, status: "upcoming" as const },
      { name: "September at Great River", courseIdx: 5, date: "2026-09-19", format: "stroke" as const, isMajor: false, eventNumber: 6, status: "upcoming" as const },
      { name: "October at Fox Hopyard", courseIdx: 6, date: "2026-10-17", format: "stroke" as const, isMajor: false, eventNumber: 7, status: "upcoming" as const },
      { name: "November at Lake of Isles", courseIdx: 7, date: "2026-11-07", format: "stroke" as const, isMajor: true, eventNumber: 8, status: "upcoming" as const },
    ];

    const eventIds: Id<"events">[] = [];
    for (const ev of eventDefs) {
      eventIds.push(
        await ctx.db.insert("events", {
          seasonId,
          name: ev.name,
          courseId: courseIds[ev.courseIdx],
          date: ev.date,
          format: ev.format,
          isMajor: ev.isMajor,
          multiplier: ev.isMajor ? 2 : 1,
          status: ev.status,
          eventNumber: ev.eventNumber,
        })
      );
    }

    // ==========================================
    // 6. SCORES FOR COMPLETED EVENTS
    // ==========================================
    // Each score: [userIdx, gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups]
    // Shot breakdown must sum to 18 for each player

    // Event 1: April at Keney Park (Par 72, 1x multiplier)
    const event1Scores: [number, number, number, number, number, number, number, number, number, number][] = [
      [0, 84, 72, 12, 1, 0, 8, 6, 3, 0],  // Sullivan: net 72
      [1, 82, 72, 10, 2, 0, 7, 7, 2, 0],  // Chen: net 72
      [2, 92, 74, 18, 0, 0, 5, 8, 5, 0],  // Barrett: net 74
      [3, 89, 74, 15, 1, 0, 6, 7, 4, 0],  // Morales: net 74
      [4, 96, 76, 20, 0, 0, 4, 7, 6, 1],  // O'Brien: net 76
      [5, 88, 74, 14, 1, 0, 6, 8, 3, 0],  // Park: net 74
      [6, 100, 78, 22, 0, 0, 3, 6, 7, 2], // DeLuca: net 78
      [7, 103, 79, 24, 0, 0, 2, 7, 6, 3], // Walsh: net 79
    ];

    for (const [userIdx, gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups] of event1Scores) {
      await ctx.db.insert("scores", {
        eventId: eventIds[0],
        userId: userIds[userIdx],
        gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups,
        pointsEarned: 0,
        finishPosition: 0,
      });
    }
    await calculateAndApplyEventPoints(ctx, eventIds[0]);

    // Event 2: May at Shennecossett (Par 71, 1x multiplier)
    const event2Scores: [number, number, number, number, number, number, number, number, number, number][] = [
      [0, 85, 73, 12, 1, 0, 7, 7, 3, 0],  // Sullivan: net 73
      [1, 80, 70, 10, 3, 0, 8, 5, 2, 0],  // Chen: net 70 (winner)
      [2, 90, 72, 18, 1, 0, 5, 7, 5, 0],  // Barrett: net 72
      [3, 86, 71, 15, 2, 0, 7, 6, 3, 0],  // Morales: net 71
      [4, 95, 75, 20, 0, 0, 5, 6, 6, 1],  // O'Brien: net 75
      [5, 85, 71, 14, 2, 0, 7, 6, 3, 0],  // Park: net 71
      [6, 97, 75, 22, 0, 0, 4, 7, 5, 2],  // DeLuca: net 75
      [7, 101, 77, 24, 0, 0, 3, 7, 5, 3], // Walsh: net 77
    ];

    for (const [userIdx, gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups] of event2Scores) {
      await ctx.db.insert("scores", {
        eventId: eventIds[1],
        userId: userIds[userIdx],
        gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups,
        pointsEarned: 0,
        finishPosition: 0,
      });
    }
    await calculateAndApplyEventPoints(ctx, eventIds[1]);

    // Event 3: June at Oxford Greens (Par 72, 1x multiplier)
    const event3Scores: [number, number, number, number, number, number, number, number, number, number][] = [
      [0, 83, 71, 12, 2, 0, 8, 5, 3, 0],  // Sullivan: net 71
      [1, 81, 71, 10, 2, 0, 9, 5, 2, 0],  // Chen: net 71
      [2, 91, 73, 18, 0, 0, 6, 7, 5, 0],  // Barrett: net 73
      [3, 87, 72, 15, 1, 0, 7, 7, 3, 0],  // Morales: net 72
      [4, 94, 74, 20, 1, 0, 4, 8, 4, 1],  // O'Brien: net 74
      [5, 86, 72, 14, 1, 0, 8, 6, 3, 0],  // Park: net 72
      [6, 98, 76, 22, 0, 0, 3, 8, 5, 2],  // DeLuca: net 76
      [7, 102, 78, 24, 0, 0, 3, 6, 7, 2], // Walsh: net 78
    ];

    for (const [userIdx, gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups] of event3Scores) {
      await ctx.db.insert("scores", {
        eventId: eventIds[2],
        userId: userIds[userIdx],
        gross, net, handicap, birdies, eagles, pars, bogeys, doublePlus, pickups,
        pointsEarned: 0,
        finishPosition: 0,
      });
    }
    await calculateAndApplyEventPoints(ctx, eventIds[2]);

    // ==========================================
    // 7. LIVE ROUNDS FOR EVENT 4 (active event)
    // ==========================================
    // Wintonbury Hills pars: [4,3,5,4,4,3,4,5,4, 4,4,3,5,4,4,3,5,4]
    const now = Date.now();

    // Dave Chen — thru 12 holes, relToPar -1
    // Par thru 12: 4+3+5+4+4+3+4+5+4+4+4+3 = 47
    // Score thru 12: 4+3+4+4+5+3+3+5+4+3+4+4 = 46
    const chenRoundId = await ctx.db.insert("liveRounds", {
      eventId: eventIds[3],
      userId: userIds[1],
      status: "inProgress",
      currentHole: 13,
      totalScore: 46,
      relToPar: -1,
      startedAt: now - 3 * 60 * 60 * 1000, // started 3 hours ago
    });

    const chenHoleScores: { holeNumber: number; par: number; score: number; relToPar: number; pickedUp: boolean }[] = [
      { holeNumber: 1, par: 4, score: 4, relToPar: 0, pickedUp: false },
      { holeNumber: 2, par: 3, score: 3, relToPar: 0, pickedUp: false },
      { holeNumber: 3, par: 5, score: 4, relToPar: -1, pickedUp: false },
      { holeNumber: 4, par: 4, score: 4, relToPar: 0, pickedUp: false },
      { holeNumber: 5, par: 4, score: 5, relToPar: 1, pickedUp: false },
      { holeNumber: 6, par: 3, score: 3, relToPar: 0, pickedUp: false },
      { holeNumber: 7, par: 4, score: 3, relToPar: -1, pickedUp: false },
      { holeNumber: 8, par: 5, score: 5, relToPar: 0, pickedUp: false },
      { holeNumber: 9, par: 4, score: 4, relToPar: 0, pickedUp: false },
      { holeNumber: 10, par: 4, score: 3, relToPar: -1, pickedUp: false },
      { holeNumber: 11, par: 4, score: 4, relToPar: 0, pickedUp: false },
      { holeNumber: 12, par: 3, score: 4, relToPar: 1, pickedUp: false },
    ];
    for (const hs of chenHoleScores) {
      await ctx.db.insert("holeScores", { liveRoundId: chenRoundId, ...hs });
    }

    // Mike Sullivan — thru 7 holes, relToPar +3
    // Par thru 7: 4+3+5+4+4+3+4 = 27
    // Score thru 7: 5+3+5+4+5+4+4 = 30
    const sullivanRoundId = await ctx.db.insert("liveRounds", {
      eventId: eventIds[3],
      userId: userIds[0],
      status: "inProgress",
      currentHole: 8,
      totalScore: 30,
      relToPar: 3,
      startedAt: now - 2 * 60 * 60 * 1000, // started 2 hours ago
    });

    const sullivanHoleScores: { holeNumber: number; par: number; score: number; relToPar: number; pickedUp: boolean }[] = [
      { holeNumber: 1, par: 4, score: 5, relToPar: 1, pickedUp: false },
      { holeNumber: 2, par: 3, score: 3, relToPar: 0, pickedUp: false },
      { holeNumber: 3, par: 5, score: 5, relToPar: 0, pickedUp: false },
      { holeNumber: 4, par: 4, score: 4, relToPar: 0, pickedUp: false },
      { holeNumber: 5, par: 4, score: 5, relToPar: 1, pickedUp: false },
      { holeNumber: 6, par: 3, score: 4, relToPar: 1, pickedUp: false },
      { holeNumber: 7, par: 4, score: 4, relToPar: 0, pickedUp: false },
    ];
    for (const hs of sullivanHoleScores) {
      await ctx.db.insert("holeScores", { liveRoundId: sullivanRoundId, ...hs });
    }

    // Tom Barrett — thru 4 holes, relToPar +4
    // Par thru 4: 4+3+5+4 = 16
    // Score thru 4: 5+4+7+4 = 20
    const barrettRoundId = await ctx.db.insert("liveRounds", {
      eventId: eventIds[3],
      userId: userIds[2],
      status: "inProgress",
      currentHole: 5,
      totalScore: 20,
      relToPar: 4,
      startedAt: now - 1 * 60 * 60 * 1000, // started 1 hour ago
    });

    const barrettHoleScores: { holeNumber: number; par: number; score: number; relToPar: number; pickedUp: boolean }[] = [
      { holeNumber: 1, par: 4, score: 5, relToPar: 1, pickedUp: false },
      { holeNumber: 2, par: 3, score: 4, relToPar: 1, pickedUp: false },
      { holeNumber: 3, par: 5, score: 7, relToPar: 2, pickedUp: false },
      { holeNumber: 4, par: 4, score: 4, relToPar: 0, pickedUp: false },
    ];
    for (const hs of barrettHoleScores) {
      await ctx.db.insert("holeScores", { liveRoundId: barrettRoundId, ...hs });
    }

    // ==========================================
    // 8. ACHIEVEMENTS
    // ==========================================
    await ctx.db.insert("achievements", {
      userId: userIds[1], // Dave Chen
      type: "Low Round",
      eventId: eventIds[1], // Event 2 — net 70
      earnedAt: now,
    });
    await ctx.db.insert("achievements", {
      userId: userIds[0], // Mike Sullivan
      type: "Eagle",
      eventId: eventIds[2], // Event 3
      earnedAt: now,
    });
    await ctx.db.insert("achievements", {
      userId: userIds[1], // Dave Chen
      type: "Birdie Streak",
      eventId: eventIds[0], // Event 1
      earnedAt: now,
    });
    await ctx.db.insert("achievements", {
      userId: userIds[3], // Chris Morales
      type: "Most Improved",
      seasonId,
      earnedAt: now,
    });

    // ==========================================
    // 9. HEAD-TO-HEAD RECORDS
    // ==========================================
    // Canonical ordering: userId1 < userId2 (compare as strings)
    function insertH2H(
      idA: Id<"users">,
      winsA: number,
      idB: Id<"users">,
      winsB: number,
      ties: number
    ) {
      if (idA < idB) {
        return ctx.db.insert("headToHead", {
          userId1: idA, userId2: idB, seasonId,
          wins1: winsA, wins2: winsB, ties,
        });
      } else {
        return ctx.db.insert("headToHead", {
          userId1: idB, userId2: idA, seasonId,
          wins1: winsB, wins2: winsA, ties,
        });
      }
    }

    // Chen vs Sullivan: E1 tie, E2 Chen wins, E3 tie => Chen 1, Sullivan 0, 2 ties
    await insertH2H(userIds[1], 1, userIds[0], 0, 2);
    // Chen vs Morales: Chen wins all 3 => Chen 3, Morales 0, 0 ties
    await insertH2H(userIds[1], 3, userIds[3], 0, 0);
    // Sullivan vs Park: E1 Sullivan, E2 Park, E3 Sullivan => Sullivan 2, Park 1, 0 ties
    await insertH2H(userIds[0], 2, userIds[5], 1, 0);
    // Morales vs Park: All 3 tied => 0, 0, 3 ties
    await insertH2H(userIds[3], 0, userIds[5], 0, 3);

    // ==========================================
    // 10. CHAT MESSAGES
    // ==========================================
    const messages = [
      { userId: userIds[0], content: "Welcome to the 2026 season everyone! Let's make it a great year.", messageType: "announcement" as const, offset: 7 },
      { userId: userIds[1], content: "Just played a practice round at Keney Park. Greens are rolling fast this year.", messageType: "chat" as const, offset: 6 },
      { userId: userIds[2], content: "Anyone need a ride to April at Keney Park?", messageType: "chat" as const, offset: 5 },
      { userId: userIds[3], content: "Congrats to Dave and Mike on the T1 finish at Keney Park!", messageType: "chat" as const, offset: 3 },
      { userId: userIds[1], content: "Great playing with everyone at Shennecossett. That course is a gem.", messageType: "chat" as const, offset: 1 },
      { userId: userIds[0], content: "Event 2 results: Dave Chen takes 1st with a net 70 at Shennecossett!", messageType: "result" as const, offset: 1 },
    ];

    for (const msg of messages) {
      await ctx.db.insert("messages", {
        leagueId: "ct-championship-2026",
        userId: msg.userId,
        content: msg.content,
        messageType: msg.messageType,
        timestamp: now - msg.offset * 24 * 60 * 60 * 1000,
      });
    }

    return {
      coursesCreated: 8,
      courseHolesCreated: 54, // 18 + 18 + 18
      usersCreated: 8,
      eventsCreated: 8,
      completedEvents: 3,
      liveRoundsCreated: 3,
      holeScoresCreated: 23, // 12 + 7 + 4
      achievementsCreated: 4,
      headToHeadCreated: 4,
      messagesCreated: 6,
    };
  },
});

/**
 * Clears all seeded data including courses, seasons, events, scores, standings,
 * rounds, hole data, achievements, head-to-head records, messages, and seed users.
 * Run via CLI: npx convex run seed:clearData
 * Does NOT delete real Clerk-authenticated users.
 */
export const clearData = internalMutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;

    // Delete in dependency order (children before parents)
    const tables = [
      "holeScores",
      "liveRounds",
      "scores",
      "standings",
      "achievements",
      "headToHead",
      "messages",
      "courseHoles",
      "events",
      "courses",
      "seasons",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
      totalDeleted += docs.length;
    }

    // Delete seed users (clerkId starts with "seed_player_")
    const allUsers = await ctx.db.query("users").collect();
    for (const user of allUsers) {
      if (user.clerkId.startsWith("seed_player_")) {
        await ctx.db.delete(user._id);
        totalDeleted++;
      }
    }

    return { totalDeleted };
  },
});

/**
 * Purges ALL data from every table (including real users).
 * Use this before going live to start completely fresh.
 * Run via CLI: npx convex run seed:purgeAllData
 * WARNING: This is destructive and irreversible.
 * Includes notifications and pushSubscriptions so no rows are left behind.
 */
export const purgeAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;

    const tables = [
      "holeScores",
      "liveRounds",
      "scores",
      "standings",
      "achievements",
      "headToHead",
      "messages",
      "pushSubscriptions",
      "notifications",
      "photos",
      "courseHoles",
      "events",
      "courses",
      "seasons",
      "users",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
      totalDeleted += docs.length;
    }

    return { totalDeleted };
  },
});

/**
 * Promotes the first user to super admin.
 * Run via CLI: npx convex run seed:promoteSuperAdmin
 * Sign in first to create your user.
 */
export const promoteSuperAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      throw new Error("No users found. Sign in first to create your user.");
    }

    const firstUser = users[0];
    await ctx.db.patch(firstUser._id, {
      isCommissioner: true,
      isSuperAdmin: true,
    });

    return { promoted: firstUser.name, userId: firstUser._id };
  },
});
