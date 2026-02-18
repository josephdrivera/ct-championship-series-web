import { mutation } from "./_generated/server";

/**
 * Seeds the database with the 2026 CT Championship Series data.
 * Run via CLI: npx convex run seed:seedData
 *
 * This will:
 * - Create the 8 courses for the 2026 season
 * - Create the 2026 season (active)
 * - Create 8 monthly events (April–November)
 *
 * NOTE: This does NOT create users — users are created via Clerk webhook
 * when they sign in. To make yourself a super admin, run promoteSuperAdmin
 * after signing in.
 */
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCourses = await ctx.db.query("courses").collect();
    if (existingCourses.length > 0) {
      throw new Error("Database already has data. Run seed:clearData first if you want to re-seed.");
    }

    // 2026 CT Eight-Month Open course lineup
    const courses = [
      { name: "Keney Park Golf Course", par: 72, holes: 18, location: "Hartford, CT" },
      { name: "Shennecossett Golf Course", par: 71, holes: 18, location: "Groton, CT" },
      { name: "Oxford Greens Golf Club", par: 72, holes: 18, location: "Oxford, CT" },
      { name: "Wintonbury Hills Golf Course", par: 72, holes: 18, location: "Bloomfield, CT" },
      { name: "Blackledge CC - Anderson Course", par: 72, holes: 18, location: "Hebron, CT" },
      { name: "Great River Golf Club", par: 72, holes: 18, location: "Milford, CT" },
      { name: "Fox Hopyard Golf Club", par: 71, holes: 18, location: "East Haddam, CT" },
      { name: "Lake of Isles - North Course", par: 72, holes: 18, location: "North Stonington, CT" },
    ];

    const courseIds = [];
    for (const course of courses) {
      const id = await ctx.db.insert("courses", course);
      courseIds.push(id);
    }

    // Create 2026 season
    const seasonId = await ctx.db.insert("seasons", {
      year: 2026,
      name: "The Connecticut Eight-Month Open",
      status: "active",
    });

    // Monthly events April through November
    const events = [
      { name: "April at Keney Park", courseIdx: 0, date: "2026-04-18", format: "stroke" as const, isMajor: false, eventNumber: 1 },
      { name: "May at Shennecossett", courseIdx: 1, date: "2026-05-16", format: "stroke" as const, isMajor: false, eventNumber: 2 },
      { name: "June at Oxford Greens", courseIdx: 2, date: "2026-06-20", format: "stroke" as const, isMajor: false, eventNumber: 3 },
      { name: "July at Wintonbury Hills", courseIdx: 3, date: "2026-07-18", format: "stroke" as const, isMajor: false, eventNumber: 4 },
      { name: "August at Blackledge", courseIdx: 4, date: "2026-08-15", format: "stroke" as const, isMajor: true, eventNumber: 5 },
      { name: "September at Great River", courseIdx: 5, date: "2026-09-19", format: "stroke" as const, isMajor: false, eventNumber: 6 },
      { name: "October at Fox Hopyard", courseIdx: 6, date: "2026-10-17", format: "stroke" as const, isMajor: false, eventNumber: 7 },
      { name: "November at Lake of Isles", courseIdx: 7, date: "2026-11-07", format: "stroke" as const, isMajor: true, eventNumber: 8 },
    ];

    for (const ev of events) {
      await ctx.db.insert("events", {
        seasonId,
        name: ev.name,
        courseId: courseIds[ev.courseIdx],
        date: ev.date,
        format: ev.format,
        isMajor: ev.isMajor,
        multiplier: ev.isMajor ? 2 : 1,
        status: "upcoming",
        eventNumber: ev.eventNumber,
      });
    }

    return { coursesCreated: courses.length, eventsCreated: events.length };
  },
});

/**
 * Clears all seeded data (courses, seasons, events, scores, standings, rounds).
 * Run via CLI: npx convex run seed:clearData
 * Does NOT delete users.
 */
export const clearData = mutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;

    const holeScoresDocs = await ctx.db.query("holeScores").collect();
    for (const doc of holeScoresDocs) await ctx.db.delete(doc._id);
    totalDeleted += holeScoresDocs.length;

    const liveRoundsDocs = await ctx.db.query("liveRounds").collect();
    for (const doc of liveRoundsDocs) await ctx.db.delete(doc._id);
    totalDeleted += liveRoundsDocs.length;

    const scores = await ctx.db.query("scores").collect();
    for (const doc of scores) await ctx.db.delete(doc._id);
    totalDeleted += scores.length;

    const standingsDocs = await ctx.db.query("standings").collect();
    for (const doc of standingsDocs) await ctx.db.delete(doc._id);
    totalDeleted += standingsDocs.length;

    const eventsDocs = await ctx.db.query("events").collect();
    for (const doc of eventsDocs) await ctx.db.delete(doc._id);
    totalDeleted += eventsDocs.length;

    const coursesDocs = await ctx.db.query("courses").collect();
    for (const doc of coursesDocs) await ctx.db.delete(doc._id);
    totalDeleted += coursesDocs.length;

    const seasonsDocs = await ctx.db.query("seasons").collect();
    for (const doc of seasonsDocs) await ctx.db.delete(doc._id);
    totalDeleted += seasonsDocs.length;

    return { totalDeleted };
  },
});

/**
 * Promotes the first user to super admin.
 * Run via CLI: npx convex run seed:promoteSuperAdmin
 * Sign in first to create your user.
 */
export const promoteSuperAdmin = mutation({
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
