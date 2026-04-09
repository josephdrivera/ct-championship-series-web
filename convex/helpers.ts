/**
 * Shared auth gates and scoring engine used by all Convex mutations.
 * Always call one of the require* helpers instead of raw ctx.auth checks.
 * See docs/ARCHITECTURE.md for the full module map.
 */
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// ── Scoring constants ──────────────────────────────────────────────
const POINTS_TABLE = [100, 85, 72, 62, 54, 48, 43, 39, 36, 33, 30];
const DNF_POINTS = 15;

/**
 * Returns the current authenticated user or null.
 */
export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}

/**
 * Returns the current authenticated user or throws.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUserOrNull(ctx);
  if (!user) throw new ConvexError("Authentication required");
  return user;
}

/**
 * Returns the current authenticated user, asserting they are not suspended.
 */
export async function requireActiveUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.isSuspended)
    throw new ConvexError(
      "Your account is suspended. You cannot perform this action."
    );
  return user;
}

/**
 * Returns the current user, asserting commissioner or super admin access.
 * Does not grant role management: `isCommissioner` / `isSuperAdmin` are only
 * changed via mutations that call `requireSuperAdmin`.
 */
export async function requireCommissioner(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!user.isCommissioner && !user.isSuperAdmin)
    throw new ConvexError("Commissioner access required");
  return user;
}

/**
 * Returns the current user, asserting super admin access.
 */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.isSuperAdmin !== true) {
    throw new ConvexError("Super admin access required");
  }
  return user;
}

// ── Visibility ─────────────────────────────────────────────────────

/**
 * Returns true when a user should appear in public-facing lists.
 * Hidden users are still visible to commissioners/super admins and to themselves.
 */
export function isUserPubliclyVisible(
  user: Doc<"users">,
  viewer: Doc<"users"> | null
): boolean {
  if (!user.hiddenFromDirectory) return true;
  if (viewer && (viewer.isCommissioner || viewer.isSuperAdmin)) return true;
  if (viewer && viewer._id === user._id) return true;
  return false;
}

// ── Scoring engine ─────────────────────────────────────────────────

/**
 * Calculates and assigns points for all scores in an event.
 * Handles ties by averaging points for tied positions.
 * Applies major multiplier. Updates standings atomically.
 */
export async function calculateAndApplyEventPoints(
  ctx: MutationCtx,
  eventId: Id<"events">
) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Event not found");

  const multiplier = event.multiplier;

  const scores = await ctx.db
    .query("scores")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();

  if (scores.length === 0) return;

  // Sort by net ascending (lower = better)
  const sorted = [...scores].sort((a, b) => a.net - b.net);

  // Assign positions with tie handling
  let position = 0;
  let i = 0;

  while (i < sorted.length) {
    const tiedGroup: (typeof sorted)[number][] = [];
    const currentNet = sorted[i].net;

    while (i < sorted.length && sorted[i].net === currentNet) {
      tiedGroup.push(sorted[i]);
      i++;
    }

    // Average the points for tied positions
    let totalPointsForGroup = 0;
    for (let p = position; p < position + tiedGroup.length; p++) {
      totalPointsForGroup +=
        p < POINTS_TABLE.length ? POINTS_TABLE[p] : DNF_POINTS;
    }
    const avgPoints = totalPointsForGroup / tiedGroup.length;
    const finalPoints = avgPoints * multiplier;
    const finishPos = position + 1; // 1-indexed

    for (const score of tiedGroup) {
      await ctx.db.patch(score._id, {
        pointsEarned: finalPoints,
        finishPosition: finishPos,
      });
    }

    position += tiedGroup.length;
  }

  // Handle withdrawn players with no score record
  const withdrawnRounds = await ctx.db
    .query("liveRounds")
    .withIndex("by_event_status", (q) =>
      q.eq("eventId", eventId).eq("status", "withdrawn")
    )
    .collect();

  for (const round of withdrawnRounds) {
    const existingScore = await ctx.db
      .query("scores")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", eventId).eq("userId", round.userId)
      )
      .unique();

    if (!existingScore) {
      await ctx.db.insert("scores", {
        eventId,
        userId: round.userId,
        gross: round.totalScore,
        net: round.totalScore,
        handicap: 0,
        birdies: 0,
        eagles: 0,
        pars: 0,
        bogeys: 0,
        doublePlus: 0,
        pickups: 0,
        pointsEarned: DNF_POINTS * multiplier,
        finishPosition: position + 1,
      });
    }
  }

  // Mark event as completed
  await ctx.db.patch(eventId, { status: "completed" as const });

  // Recalculate season standings
  await recalculateStandings(ctx, event.seasonId);

  // Notify all players that results are finalized
  const allUsers = await ctx.db.query("users").collect();
  const now = Date.now();
  for (const user of allUsers) {
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Results Finalized",
      body: `Scores for ${event.name} are official. Check the leaderboard for updated standings.`,
      type: "event_completed",
      isRead: false,
      eventId,
      seasonId: event.seasonId,
      createdAt: now,
    });
  }
}

/**
 * Rebuilds all standings for a season from event scores.
 */
export async function recalculateStandings(
  ctx: MutationCtx,
  seasonId: Id<"seasons">
) {
  const events = await ctx.db
    .query("events")
    .withIndex("by_season", (q) => q.eq("seasonId", seasonId))
    .collect();

  // Aggregate stats per user across all events
  const userStats = new Map<
    string,
    {
      userId: Id<"users">;
      totalPoints: number;
      eventsPlayed: number;
      wins: number;
      totalGross: number;
    }
  >();

  for (const event of events) {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    for (const score of scores) {
      const key = score.userId as string;
      const existing = userStats.get(key) || {
        userId: score.userId,
        totalPoints: 0,
        eventsPlayed: 0,
        wins: 0,
        totalGross: 0,
      };
      existing.totalPoints += score.pointsEarned;
      existing.eventsPlayed += 1;
      if (score.finishPosition === 1) existing.wins += 1;
      existing.totalGross += score.gross;
      userStats.set(key, existing);
    }
  }

  // Sort by totalPoints descending
  const ranked = [...userStats.values()].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  // Assign ranks (ties get same rank)
  let currentRank = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].totalPoints < ranked[i - 1].totalPoints) {
      currentRank = i + 1;
    }
    const stats = ranked[i];
    const scoringAverage =
      stats.eventsPlayed > 0 ? stats.totalGross / stats.eventsPlayed : 0;

    // Upsert standing
    const existing = await ctx.db
      .query("standings")
      .withIndex("by_season", (q) => q.eq("seasonId", seasonId))
      .filter((q) => q.eq(q.field("userId"), stats.userId))
      .unique();

    const standingData = {
      seasonId,
      userId: stats.userId,
      totalPoints: stats.totalPoints,
      rank: currentRank,
      wins: stats.wins,
      eventsPlayed: stats.eventsPlayed,
      scoringAverage,
    };

    if (existing) {
      await ctx.db.patch(existing._id, standingData);
    } else {
      await ctx.db.insert("standings", standingData);
    }
  }
}
