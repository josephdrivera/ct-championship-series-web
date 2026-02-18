# CT Championship Series

The official tournament platform for the CT Championship Series golf league.
Built with Next.js, Convex, Clerk, and Tailwind CSS using a Masters-inspired
design theme.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config)
- **Backend:** Convex (real-time database & serverless functions)
- **Auth:** Clerk
- **Fonts:** Playfair Display (headings) + DM Sans (body)

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your keys
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Convex dev server:
   ```bash
   npx convex dev
   ```
5. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## Clerk Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Copy your **Publishable Key** and **Secret Key** into `.env.local`
3. In the Clerk Dashboard, go to **Webhooks** and create a webhook pointing to:
   ```
   https://<your-convex-deployment>.convex.site/clerk-webhook
   ```
4. Subscribe to events: `user.created`, `user.updated`
5. Copy the **Signing Secret** and set it:
   - In `.env.local` as `CLERK_WEBHOOK_SECRET`
   - In Convex: `npx convex env set CLERK_WEBHOOK_SECRET whsec_...`

## Build Checklist

- [x] Prompt 1: Project scaffold with Next.js + Tailwind Masters theme
- [x] Prompt 2: Convex schema and database setup
- [x] Prompt 3: Clerk authentication with Convex user sync
- [x] Prompt 4: Convex server functions (queries + mutations)
- [x] Prompt 5: Leaderboard page with SSR preloaded queries
- [x] Prompt 6: Events list page and event detail page with scorecard
- [x] Prompt 7: Players directory and player profile pages
- [x] Prompt 8: Live spectator page with real-time leaderboard
- [x] Prompt 9: Admin layout with auth guard and dashboard
- [x] Prompt 10: Admin season and event management pages
- [x] Prompt 11: Admin course & hole data entry
- [x] Prompt 12: Admin score entry & points calculation
- [x] Prompt 13: Admin player management with edit forms and bulk handicap updates
- [x] Prompt 14: Landing page with hero, mini-leaderboard, upcoming event, and recent results
- [x] Prompt 15: League History & Hall of Fame page with champions, major winners, all-time records, and past standings
- [x] Prompt 16: Responsive design, PWA manifest, service worker, cookie banner, privacy/terms pages, and loading skeletons
- [ ] Prompt 17
- [ ] Prompt 18
