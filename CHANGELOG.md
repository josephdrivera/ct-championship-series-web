# Changelog

All notable changes to the CT Championship Series project will be documented
in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2026-02-17

### Added

- Admin courses page at /admin/courses with full course and hole data management
- Course creation form with fields: name, par, holes (default 18), location, description, latitude/longitude (optional)
- Course list showing all courses with par, hole count, number of events played, and hole data status (Complete vs Pending)
- Hole data entry form: table with rows per hole, each having pre-filled hole number, par dropdown (3/4/5), yardage input, and optional GPS coordinates (tee lat/lng, green lat/lng)
- "Save All 18 Holes" button that calls addCourseHoles mutation with full array validation
- Client-side validation ensuring all holes have par and yardage before saving
- Pre-fill support for editing existing hole data (supports re-upload)
- Total par and total yardage summary in table footer
- New Convex query: getCoursesWithStats — returns all courses with hole data completion status and event count

## [0.10.1] - 2026-02-17

### Added

- Super admin role (`isSuperAdmin` field on users schema) with elevated privileges
- `requireSuperAdmin` auth helper in convex/helpers.ts
- `updateUserRole` mutation — super admins can promote/demote commissioners and other super admins
- Admin players page at /admin/players with role badges (Super Admin, Commissioner, Member)
- Role management toggle buttons for super admins to promote/demote users
- Player invite form using Clerk backend SDK — sends email invitations to join the league
- API route at /api/invite for sending Clerk invitations
- Seed script (convex/seed.ts) with `seedData` mutation to bootstrap courses, season, and events
- `promoteSuperAdmin` seed mutation to promote the first user to super admin
- Admin layout now recognizes super admins alongside commissioners
- Header Admin link now visible to both commissioners and super admins
- Removed sign-up page (invitation-only mode)

### Changed

- `requireCommissioner` helper now grants access to both commissioners and super admins
- Admin layout shows "Super Admin" or "Commissioner" role label dynamically

## [0.10.0] - 2026-02-17

### Added

- Admin seasons page at /admin/seasons with full season management
- Create new season form with year and name fields, inline validation, and duplicate year prevention
- Season list showing all seasons with status badges (upcoming/active/completed)
- Status toggle buttons to transition seasons between upcoming, active, and completed
- Champion assignment dropdown on completed seasons (populated from player list)
- Admin events page at /admin/events with full event management for the active season
- Create event form with fields: name, course selector, date picker, format selector (stroke/match/bestBall/scramble/stableford/skins), event number (1-8), and major toggle with 2x multiplier badge
- Events list showing all season events with status badges, major badges, course, date, and format
- Inline edit form per event with pre-populated fields and save/cancel buttons
- Status toggle buttons per event (upcoming/active/completed/canceled)
- New Convex query: getAllSeasons for listing all seasons sorted by year
- New Convex mutation: updateSeason for changing season status, name, and champion
- Installed sonner toast library for success/error notifications
- Toast notifications on all create, update, and status change operations
- Inline validation errors on required form fields
- Toaster component added to admin layout with Masters-themed styling

## [0.9.0] - 2026-02-17

### Added

- Admin layout at /admin with Clerk middleware protection (redirects unauthenticated users to sign-in)
- Commissioner authorization guard using Convex `getCurrentUser` query — shows "Not Authorized" for non-commissioners
- Dark green sidebar navigation with links: Dashboard, Events, Courses, Scores, Players, Seasons
- Commissioner name, avatar, and role badge in sidebar header
- Active link highlighting using `usePathname()` with augusta green background
- "Back to site" link at sidebar bottom
- Mobile-responsive hamburger menu that opens sidebar as overlay with backdrop
- Admin dashboard page with summary cards: Active Season, Upcoming Events count, Total Players count
- Quick action buttons: Create Event, Enter Scores, Add Course (linking to admin sub-pages)
- Conditional "Admin" link in site header — only visible to commissioners, styled in gold
- Loading spinner state while auth status is being determined

## [0.8.0] - 2026-02-17

### Added

- Live spectator page at /live/[eventId] — public, no auth required
- Dark green background matching the Masters aesthetic throughout the page
- Green pulsing LIVE NOW badge when event is actively being played
- Real-time leaderboard table with columns: Position, Player (avatar + name), Thru, Today (color-coded: gold for under par, green for even, red for over), Gross, Net
- Convex real-time subscriptions via useQuery for automatic leaderboard updates
- Framer Motion animated row reordering when player positions change (layout animations)
- Expandable player detail rows showing hole-by-hole scorecard on click
- New Convex query: getRoundHoleScores for fetching per-hole scoring data
- "Last updated" timestamp that refreshes with each real-time data update
- "Tournament has not started yet" state for upcoming events with link to event detail
- "Tournament complete — see final results" state for completed events with link to event detail
- Open Graph meta tags for shareable live spectator URLs
- "Share this link for anyone to spectate" footer message
- Added /live route to Clerk middleware public routes
- Installed framer-motion dependency for layout animations

## [0.7.0] - 2026-02-17

### Added

- Players directory page at /players with filterable, sortable card grid
- Search input to filter players by name with real-time filtering
- Sort options: rank, name, handicap with pill-style toggle buttons
- Player cards showing: avatar/initials, name, rank badge (gold for top 3), handicap, mini medal counts (wins + events)
- Player profile page at /players/[userId] with green hero header and avatar
- 3x2 stats grid: total points, avg score, wins, handicap, birdies, standing
- Handicap trend chart using Recharts (green area chart with gradient fill, gold dot for current value)
- Achievement badges row with earned (gold tint) and locked (dimmed) states for known achievement types
- Recent results list with event links, course names, gross/net scores, finish positions, and points
- Gold accent on winner results matching leaderboard pattern
- JSON-LD structured data (Person schema) on player profiles for SEO
- SEO metadata and Open Graph tags for both player pages
- Breadcrumbs navigation: Home > Players > Player Name
- Installed recharts dependency for data visualization

## [0.6.0] - 2026-02-17

### Added

- Events list page at /events showing all season events in a card grid
- Event cards with: event number, name, course, date, format badge, MAJOR badge (azalea pink), status indicator
- Green pulsing LIVE badge on active events using fairway color with animate-pulse
- Event detail page at /events/[eventId] with hero header on dark green gradient
- Info chips row: date, format, par, and multiplier on the detail page
- Scorecard table with columns: Position, Player, Gross, Net, +/- to Par, Points
- Gold accent row highlight for event winner matching leaderboard pattern
- Azalea pink major championship banner with "2x Points" indicator on major events
- Breadcrumbs navigation: Home > Events > Event Name with aria-current for accessibility
- generateStaticParams for pre-rendering completed event detail pages at build time
- SEO metadata and Open Graph tags for both events pages
- Convex queries: getSeasonEvents (all events with course join), getEventById (single event), getCompletedEventIds (for static generation)

## [0.5.0] - 2026-02-17

### Added

- Leaderboard page at /leaderboard with SSR using Convex preloaded queries
- Featured leader card with dark green gradient, gold crown icon, avatar, total points, wins, and scoring average
- Full standings table with columns: Rank, Player (avatar + name), Wins, Avg Score, Handicap, Points, Gap to Leader
- Gold highlight on leader row in standings table
- PlayerAvatar component with next/image for Clerk photos and initials fallback
- Open Graph meta tags for social sharing (title and description)
- Responsive layout with horizontal scroll table on mobile
- Empty state handling for no active season and no standings data

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
