# CT Championship Series

Web application for the **CT Championship Series** golf league: seasons, events, live scoring, standings, player profiles, and league history. The public can follow leaderboards and live rounds; members sign in; commissioners and super admins manage data through a protected admin area.

The UI uses a Masters-inspired visual theme (deep greens, gold accents) with **Playfair Display** for headings and **DM Sans** for body text.

## Features

- **Public:** Home, season leaderboard, events list and detail (scorecards), player directory and profiles, league history and hall-of-fame style records, live event spectator views with real-time updates.
- **Members:** Sign in with Clerk; optional event check-in and personal score entry where enabled; notifications and optional web push (when configured).
- **Admins:** Role-gated dashboard for seasons, events, courses and holes, scores and points, players, and announcements/reminders (including email flows via Resend where configured).

SEO basics include `sitemap.xml` and `robots.txt`. A PWA manifest and related assets support installable / offline-minded behavior where applicable.

## Tech stack


| Layer          | Technology                                                          |
| -------------- | ------------------------------------------------------------------- |
| Framework      | [Next.js](https://nextjs.org/) 16 (App Router)                      |
| Language       | [TypeScript](https://www.typescriptlang.org/)                       |
| Styling        | [Tailwind CSS](https://tailwindcss.com/) v4                         |
| Backend / data | [Convex](https://www.convex.dev/) (queries, mutations, HTTP routes) |
| Authentication | [Clerk](https://clerk.com/)                                         |
| Email          | [Resend](https://resend.com/) (invites and transactional templates) |
| Charts         | [Recharts](https://recharts.org/)                                   |
| Motion         | [Framer Motion](https://www.framer.com/motion/)                     |
| Toast UI       | [Sonner](https://sonner.emilkowal.ski/)                             |


## Dependencies

Runtime dependencies are declared in `package.json`, including:

- **Next.js** `next`, **React** `react` / `react-dom`
- **Convex** `convex`
- **Clerk** `@clerk/nextjs`
- **Resend** `resend`, **Svix** `svix` (webhook verification patterns as used in the stack)
- **Framer Motion** `framer-motion`, **Recharts** `recharts`, **Sonner** `sonner`
- **Web Push** `web-push` (optional push notifications)

Development tooling includes **ESLint** (`eslint`, `eslint-config-next`), **Tailwind** v4 (`tailwindcss`, `@tailwindcss/postcss`), **TypeScript**, **Sharp** (for Next.js image optimization), and Node type packages.

Install everything with:

```bash
npm install
```

## Requirements

- **Node.js** — current LTS recommended
- **npm** (bundled with Node) or another compatible client
- Accounts and projects for **Convex**, **Clerk**, and (for email) **Resend** when running full features locally or in production

## Getting the code

Clone the repository and enter the project directory:

```bash
git clone https://github.com/josephrivera/ct-championship-series-web.git
cd ct-championship-series-web
```

Install dependencies:

```bash
npm install
```

## Configuration

1. Copy the environment template and fill in values for your Convex and Clerk projects (and email, if used):
  ```bash
   cp .env.example .env.local
  ```
2. See `.env.example` for variable names and short comments. Convex-only secrets (for example JWT issuer and webhook verification) are set in the [Convex dashboard](https://dashboard.convex.dev) for each deployment, not only in `.env.local`.
3. **Clerk**
  - Create an application in the [Clerk dashboard](https://dashboard.clerk.com) and add the publishable and secret keys to `.env.local`.
  - Configure a JWT template named `convex` as described in the [Convex + Clerk docs](https://docs.convex.dev/auth/clerk).
  - Point the Clerk **user** webhook at your Convex HTTP route, for example `https://<your-deployment>.convex.site/clerk-webhook`, with events such as `user.created` and `user.updated`. Store the signing secret where Convex expects it (see `.env.example`).
4. **Convex**
  - From the project root, run `npx convex dev` to link the project and sync schema/functions during development.
  - Use `npx convex deploy` when deploying backend changes to production.

## Running locally

In one terminal, start Convex (required for API and data):

```bash
npx convex dev
```

In another, start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts


| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Next.js development server                |
| `npm run build` | Production build                          |
| `npm run start` | Run the production server (after `build`) |
| `npm run lint`  | ESLint                                    |


## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — system overview, module map, and where to change common behaviors.
- **[docs/SECURITY.md](docs/SECURITY.md)** — secrets, threat model notes, and hardening backlog.

## Deployment

The app is designed to run on [Vercel](https://vercel.com) (or any host that supports Next.js). Set environment variables in the host to match production: Convex **production** URL (`NEXT_PUBLIC_CONVEX_URL`), Clerk keys, `NEXT_PUBLIC_SITE_URL` for canonical URLs in `sitemap.xml` / `robots.txt`, and Resend (`RESEND_API_KEY`, `EMAIL_FROM`) if you use invite and email features.

For a full production checklist (Convex deploy, Clerk webhook URL, Vercel env vars, smoke tests), see **FinalPush.md** in the repository root.

## License

Private project (`"private": true` in `package.json`). All rights reserved unless otherwise stated by the repository owner.