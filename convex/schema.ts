import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    handicap: v.optional(v.number()),
    photo: v.optional(v.string()),
    joinedYear: v.number(),
    isCommissioner: v.boolean(),
    isSuperAdmin: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkId"]),

  seasons: defineTable({
    year: v.number(),
    name: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("completed")
    ),
    championId: v.optional(v.id("users")),
    liveOverride: v.optional(v.union(v.literal("on"), v.literal("off"))),
  })
    .index("by_year", ["year"])
    .index("by_status", ["status"]),

  events: defineTable({
    seasonId: v.id("seasons"),
    name: v.string(),
    courseId: v.id("courses"),
    date: v.string(),
    format: v.union(
      v.literal("stroke"),
      v.literal("match"),
      v.literal("bestBall"),
      v.literal("scramble"),
      v.literal("stableford"),
      v.literal("skins")
    ),
    isMajor: v.boolean(),
    multiplier: v.number(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("canceled")
    ),
    eventNumber: v.number(),
  })
    .index("by_season", ["seasonId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  courses: defineTable({
    name: v.string(),
    par: v.number(),
    holes: v.number(),
    location: v.string(),
    description: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    heroImage: v.optional(v.string()),
  }),

  courseHoles: defineTable({
    courseId: v.id("courses"),
    holeNumber: v.number(),
    par: v.number(),
    yardage: v.number(),
    teeLat: v.optional(v.number()),
    teeLng: v.optional(v.number()),
    greenLat: v.optional(v.number()),
    greenLng: v.optional(v.number()),
  }).index("by_course", ["courseId"]),

  scores: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    gross: v.number(),
    net: v.number(),
    handicap: v.number(),
    birdies: v.number(),
    eagles: v.number(),
    pars: v.number(),
    bogeys: v.number(),
    doublePlus: v.number(),
    pickups: v.number(),
    pointsEarned: v.number(),
    finishPosition: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  standings: defineTable({
    seasonId: v.id("seasons"),
    userId: v.id("users"),
    totalPoints: v.number(),
    rank: v.number(),
    wins: v.number(),
    eventsPlayed: v.number(),
    scoringAverage: v.number(),
  })
    .index("by_season", ["seasonId"])
    .index("by_season_rank", ["seasonId", "rank"]),

  achievements: defineTable({
    userId: v.id("users"),
    type: v.string(),
    eventId: v.optional(v.id("events")),
    seasonId: v.optional(v.id("seasons")),
    earnedAt: v.number(),
  }).index("by_user", ["userId"]),

  headToHead: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    seasonId: v.id("seasons"),
    wins1: v.number(),
    wins2: v.number(),
    ties: v.number(),
  })
    .index("by_season", ["seasonId"])
    .index("by_matchup", ["userId1", "userId2"]),

  liveRounds: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("notStarted"),
      v.literal("inProgress"),
      v.literal("completed"),
      v.literal("withdrawn")
    ),
    currentHole: v.number(),
    totalScore: v.number(),
    relToPar: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_event_status", ["eventId", "status"])
    .index("by_user", ["userId"]),

  holeScores: defineTable({
    liveRoundId: v.id("liveRounds"),
    holeNumber: v.number(),
    par: v.number(),
    score: v.number(),
    relToPar: v.number(),
    pickedUp: v.boolean(),
  })
    .index("by_round", ["liveRoundId"])
    .index("by_round_hole", ["liveRoundId", "holeNumber"]),

  messages: defineTable({
    leagueId: v.string(),
    userId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("chat"),
      v.literal("announcement"),
      v.literal("result")
    ),
    timestamp: v.number(),
  })
    .index("by_league", ["leagueId"])
    .index("by_timestamp", ["timestamp"]),

  photos: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_event", ["eventId"]),
});
