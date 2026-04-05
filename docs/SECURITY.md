# Security notes — CT Championship Series

Last reviewed: April 2026

## Authentication and authorization

All Convex mutations that modify data use centralized auth helpers in
`convex/helpers.ts`. These are the **only** sanctioned way to gate access:

| Helper | Required role | Used by |
|--------|---------------|---------|
| `requireUser` | Any authenticated user | `startRound`, `submitHoleScore`, push subscribe, notification read/delete |
| `requireActiveUser` | Authenticated + not suspended | `submitScore` (player self-submit) |
| `requireCommissioner` | Commissioner **or** super admin | Event/course/season CRUD, admin score entry, standings, announcements, suspend/unsuspend |
| `requireSuperAdmin` | Super admin only | `updateUserRole`, `deletePlayer`, invite API route |

Every public `mutation` export was audited; none bypass these helpers.
`internalMutation` / `internalAction` functions (`seed.*`, `upsertFromClerk`,
`notifyAllPlayers`, `sendPushToAll`, etc.) are server-only and cannot be called
from the browser — Convex enforces this at the framework level.

## Public surface (intentional)

The following Convex **queries** are callable without authentication. This is by
design — the site is a public-facing league directory.

- Player directory: `players.getAllPlayers`, `players.getPlayersWithStats`,
  `players.getPlayerProfile`, `users.getUser`
- Leaderboard / events / history: `standings.getSeasonStandings`,
  `events.getUpcomingEvents`, `events.getSeasonEvents`, `events.getEventById`,
  `scores.getEventScores`, `rounds.getLiveLeaderboard`, `history.*`
- Seasons / courses: `seasons.getActiveSeason`, `courses.getAllCourses`,
  `courses.getCourseHoles`, `courses.getCoursesWithStats`

**Risk:** These expose names, photos, handicaps, and scores — standard league
information. If emails, phone numbers, or other PII are ever added to the
`users` table, restrict queries to return a public-safe shape.

## Webhook (Clerk -> Convex)

The Clerk webhook endpoint lives in **Convex** (`convex/http.ts`), not in
Next.js on Vercel. It uses Svix signature verification via `CLERK_WEBHOOK_SECRET`.

- The webhook URL is `https://<deployment>.convex.site/clerk-webhook`.
- `CLERK_WEBHOOK_SECRET` must be set in the **Convex** dashboard (production
  environment variables), not on Vercel.
- `CLERK_JWT_ISSUER_DOMAIN` must also be set on **Convex** (used by
  `convex/auth.config.ts`).

## Next.js API route (`POST /api/invite`)

Protected by Clerk middleware (not in the `isPublicRoute` list in
`middleware.ts`), plus an explicit `isSuperAdmin` check via Convex
`fetchQuery(api.users.getCurrentUser)` with a JWT template named `convex`.

## Secrets placement

| Secret | Where to set | Why |
|--------|-------------|-----|
| `CLERK_SECRET_KEY` | Vercel | Used by Clerk SDK in Next.js server code |
| `CLERK_WEBHOOK_SECRET` | Convex dashboard | Webhook handler runs in Convex |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex dashboard | Auth config is in Convex |
| `RESEND_API_KEY` | Vercel | Email sent from Next.js API route |
| `VAPID_PRIVATE_KEY` | Convex dashboard | Push sent from Convex action |

**Never commit `.env.local`.** If it is ever exposed, rotate all keys
immediately (Clerk, Resend, VAPID, webhook signing secret).

## Known accepted risks and hardening backlog

| Area | Current state | Future hardening |
|------|---------------|------------------|
| **Rate limiting** | No application-level rate limits on mutations or `/api/invite`. | Add Clerk rate limits, Convex function limits, or a simple in-memory/token-bucket guard on the invite route. |
| **`submitScore` event status** | Allows scores when event is `upcoming` or `active`. | If scores should only be accepted during a live round, tighten to `active` only. |
| **`submitHoleScore` par source** | Client supplies `par`; server validates range (2–6) but does not cross-check `courseHoles`. | Derive par from `courseHoles` for the event's course + hole number to eliminate client trust. |
| **`getUser` by ID** | Any client can load a full user doc by Convex ID. | Acceptable for a league site; revisit if sensitive fields are added. |
| **JSON-LD `dangerouslySetInnerHTML`** | Used in `app/players/[userId]/page.tsx` via `JSON.stringify` on typed data. | Low XSS risk since the object is constructed server-side from DB fields; no user-controlled HTML. |
| **SAST / dependency scanning** | Not configured. | Consider adding CodeQL, Snyk, or `npm audit` to CI. |
