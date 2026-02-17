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
- [ ] Prompt 5
- [ ] Prompt 6
- [ ] Prompt 7
- [ ] Prompt 8
- [ ] Prompt 9
- [ ] Prompt 10
- [ ] Prompt 11
- [ ] Prompt 12
- [ ] Prompt 13
- [ ] Prompt 14
- [ ] Prompt 15
- [ ] Prompt 16
- [ ] Prompt 17
- [ ] Prompt 18
