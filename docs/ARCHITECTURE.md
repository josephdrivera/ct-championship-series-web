# Architecture — CT Championship Series

## System overview

```
Browser
  |
  |--> Next.js (Vercel) -----> Convex cloud (database + server functions)
  |      |                         ^
  |      |-- Clerk (auth)          |
  |      |-- Resend (invite email) |
  |      `-- /api/invite ----------+-- fetchQuery (JWT template "convex")
  |
  `--> Convex (direct client queries/mutations via ConvexReactClient)
              |
              `-- Clerk webhook at /clerk-webhook (Svix verified)
```

- **Next.js 16** (App Router) runs on Vercel. It handles SSR, static pages,
  Clerk auth middleware, and the `/api/invite` route.
- **Convex** is the real-time database and serverless function layer. Queries
  are reactive; mutations run transactionally.
- **Clerk** manages user identity. A webhook pushes `user.created` /
  `user.updated` events to `convex/http.ts`, which upserts user records via
  `internal.users.upsertFromClerk`.
- **Resend** sends branded invitation emails from `lib/email.ts`, called by
  `app/api/invite/route.ts`.

## Convex modules by domain

| Module | Tables touched | Role |
|--------|---------------|------|
| `convex/users.ts` | `users`, `scores`, `standings`, `notifications`, ... | User queries, role management, player CRUD (commissioner/super admin), Clerk sync (`upsertFromClerk`) |
| `convex/seasons.ts` | `seasons` | Season lifecycle (create, activate, complete, live toggle) |
| `convex/events.ts` | `events`, `_storage` | Event CRUD, image upload, notifications on create/cancel |
| `convex/courses.ts` | `courses`, `courseHoles` | Course + per-hole data management |
| `convex/scores.ts` | `scores` | Player score submit, admin score entry, points calculation trigger |
| `convex/rounds.ts` | `liveRounds`, `holeScores`, `scores` | Live round lifecycle (start, hole-by-hole, complete with stat aggregation) |
| `convex/standings.ts` | `standings` | Season leaderboard (commissioner-triggered recalculation) |
| `convex/notifications.ts` | `notifications` | User inbox, commissioner announcements, internal fan-out |
| `convex/pushNotifications.ts` | (reads `pushSubscriptions`) | Web Push via VAPID (`"use node"` action) |
| `convex/pushSubscriptions.ts` | `pushSubscriptions` | Subscribe/unsubscribe endpoints |
| `convex/players.ts` | `users`, `scores`, `achievements` | Public player directory and profile aggregation |
| `convex/history.ts` | `seasons`, `events`, `scores`, `standings` | Hall of Fame, major winners, all-time records |
| `convex/helpers.ts` | (shared) | Auth gate functions + scoring engine (`calculateAndApplyEventPoints`, `recalculateStandings`) |
| `convex/seed.ts` | all tables | Dev/test seed data, clear, purge, promote super admin (all `internalMutation`) |
| `convex/http.ts` | `users` (via internal mutation) | Clerk webhook HTTP handler |

## Auth gate (how to add new mutations)

All mutations must call one of the helpers in `convex/helpers.ts`:

- `requireUser(ctx)` — any logged-in user
- `requireActiveUser(ctx)` — logged in + not suspended
- `requireCommissioner(ctx)` — commissioner or super admin
- `requireSuperAdmin(ctx)` — super admin only

Never write ad-hoc `ctx.auth.getUserIdentity()` checks in mutations; use these
helpers so authorization is consistent and auditable.

## Key files for common changes

| "I want to..." | Look at |
|----------------|---------|
| Change scoring / points rules | `convex/helpers.ts` — `POINTS_TABLE`, `calculateAndApplyEventPoints`, `recalculateStandings` |
| Add a new event format | `convex/schema.ts` (format union on `events`), `convex/events.ts` |
| Add a field to users | `convex/schema.ts`, `convex/users.ts` (upsertFromClerk if Clerk-synced) |
| Change public vs protected routes | `middleware.ts` (`isPublicRoute` matcher) |
| Modify the invite flow | `app/api/invite/route.ts`, `lib/email.ts` |
| Change webhook behavior | `convex/http.ts` |
| Add a new admin mutation | Create it in the relevant `convex/*.ts`, call `requireCommissioner` or `requireSuperAdmin` |

## Environment variable split

See `docs/SECURITY.md` for the full table. In short:

- **Vercel:** Clerk keys, Resend key, `NEXT_PUBLIC_*` values
- **Convex dashboard:** `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`, optional VAPID keys
