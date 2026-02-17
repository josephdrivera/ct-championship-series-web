# Changelog

All notable changes to the CT Championship Series project will be documented
in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-02-17

### Added

- Shared auth helpers (convex/helpers.ts): getCurrentUserOrNull, requireUser, requireCommissioner
- Points calculation engine with tie-averaging, major 2x multiplier, and DNF handling (100/85/72/62/54/48/43/39/36/33/30 point scale)
- Standings recalculation helper that rebuilds rankings from all event scores
- Season queries: getActiveSeason, getChampionHistory
- Season mutation: createSeason (commissioner-only, duplicate year prevention)
- Event query: getUpcomingEvents (with course join, date-sorted)
- Event mutations: createEvent, updateEvent (commissioner-only, auto-multiplier for majors)
- Course queries: getAllCourses, getCourseHoles (sorted by hole number)
- Course mutations: createCourse, addCourseHoles (accepts 18-hole array, supports re-upload)
- Score query: getEventScores (with user data, sorted by position)
- Score mutations: submitScore (duplicate prevention), calculateEventPoints (commissioner trigger)
- Standings query: getSeasonStandings (pre-sorted by rank with user data)
- Standings mutation: updateStandings (commissioner trigger for recalculation)
- Live round queries: getActiveRounds, getLiveLeaderboard (real-time sorted by relToPar)
- Round mutations: startRound, submitHoleScore (hole-by-hole with validation), completeRound (aggregates stats, writes scores, auto-triggers points when all rounds done)
- Player queries: getAllPlayers (name-sorted), getPlayerProfile (aggregated stats, recent scores, achievements), getHeadToHead (canonical ID ordering, cross-season aggregation)

## [0.3.0] - 2026-02-17

### Added

- Clerk authentication integration with ClerkProvider and ConvexProviderWithClerk
- ConvexClientProvider wrapper component for client-side auth context
- Middleware protecting non-public routes with clerkMiddleware
- Sign-in page at /sign-in with Masters-themed Clerk components
- Sign-up page at /sign-up with Masters-themed Clerk components
- Clerk webhook handler (convex/http.ts) for user.created and user.updated events
- Svix webhook signature verification for security
- User upsert internal mutation (convex/users.ts) for syncing Clerk users to Convex
- getCurrentUser query for fetching the authenticated user's Convex record
- Auth-aware Header with SignedIn/SignedOut states and UserButton
- Clerk profile image domain in next.config.ts

## [0.2.0] - 2026-02-17

### Added

- Convex schema with 13 tables: users, seasons, events, courses, courseHoles, scores, standings, achievements, headToHead, liveRounds, holeScores, messages, photos
- 23 database indexes for efficient querying across all tables
- Typed validators with union types for status and format fields
- Table references via v.id() for relational integrity
- Convex file storage reference (v.id("_storage")) for photos table

## [0.1.0] - 2026-02-17

### Added

- Project scaffold with Next.js 16, React 19, and Tailwind CSS v4
- Masters-inspired color palette (augusta, deep-green, dark-green, midnight, gold, cream, sand, azalea, birdie-red, eagle-blue, fairway)
- Playfair Display (headings) and DM Sans (body) font integration
- Dark green header with gold CS monogram and navigation links
- Themed landing page with CTA buttons
- Convex backend integration
- Environment variable template (.env.example)
