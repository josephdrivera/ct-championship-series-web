# CT Championship Series — Vercel release walkthrough

This document walks through **every step** from your laptop to a live site on Vercel, including Convex, Clerk, Resend, environment variables, webhooks, optional data cleanup, and final verification.

Use it as a checklist; check off sections as you go.

---

## 0. Prerequisites

- [ ] **Node.js** installed (LTS recommended).
- [ ] **Git** repo pushed to GitHub (or GitLab / Bitbucket — Vercel supports these).
- [ ] Accounts: [Convex](https://www.convex.dev/), [Clerk](https://clerk.com), [Vercel](https://vercel.com), [Resend](https://resend.com) (for invite emails).
- [ ] Decide whether Vercel will use Clerk **development** or **production** keys. The Convex env variable `CLERK_JWT_ISSUER_DOMAIN` must match **that same** Clerk instance’s JWT issuer (see step 4).

---

## 1. Local sanity check (before any deploy)

From the project root:

```bash
npm install
npm run lint
npm run build
```

- [ ] `npm run lint` completes with **no errors** (warnings are OK).
- [ ] `npm run build` succeeds.

**Note:** If the build talks to Convex during prerender, it needs network access to your Convex URL (same as on Vercel). If build fails on fetch, confirm `NEXT_PUBLIC_CONVEX_URL` in `.env.local` points at a reachable deployment.

- [ ] Commit and **push** your branch to your remote (e.g. `main` or `dev`).

---

## 2. Convex — deploy backend to production

Convex holds your database and the **Clerk webhook** HTTP handler (`convex/http.ts`).

1. Log in and link the project (if you have not already):

   ```bash
   npx convex login
   npx convex dev
   ```

   (You can stop `convex dev` after it syncs; deploy uses the same project.)

2. Deploy **production** functions and schema:

   ```bash
   npx convex deploy
   ```

3. Note the output URLs:
   - **HTTP API / client URL** — looks like `https://YOUR_DEPLOYMENT.convex.cloud` → this is what you put in **`NEXT_PUBLIC_CONVEX_URL`** on Vercel.
   - **HTTP site / webhooks** — the hostname `YOUR_DEPLOYMENT.convex.site` is used for the Clerk webhook path below.

- [ ] Production deploy succeeded.
- [ ] You copied `https://YOUR_DEPLOYMENT.convex.cloud` for Vercel.

---

## 3. Convex — production environment variables (dashboard)

Open [Convex Dashboard](https://dashboard.convex.dev) → your project → **Settings** → **Environment variables** → **Production**.

Set at least:

| Variable | Where to get the value |
|----------|-------------------------|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk Dashboard → **API Keys** or **JWT templates** — the **Frontend API URL** / issuer, e.g. `https://YOUR_INSTANCE.clerk.accounts.dev` (dev) or your production Clerk issuer. Must match the Clerk app whose keys you use on Vercel. |
| `CLERK_WEBHOOK_SECRET` | Clerk → **Webhooks** → your endpoint → **Signing secret** (`whsec_...`). Same secret you will paste in Clerk when creating the webhook (step 5). |

Optional (push notifications only):

| Variable | Purpose |
|----------|---------|
| `VAPID_PUBLIC_KEY` | Server-side push; pair with client `NEXT_PUBLIC_VAPID_PUBLIC_KEY` on Vercel. |
| `VAPID_PRIVATE_KEY` | Private key for sending pushes. |
| `VAPID_SUBJECT` | Often `mailto:you@yourdomain.com`. |

- [ ] `CLERK_JWT_ISSUER_DOMAIN` set for **Production**.
- [ ] `CLERK_WEBHOOK_SECRET` set for **Production**.

Redeploy or wait for Convex to pick up env changes (usually immediate for new requests).

---

## 4. Clerk — JWT template for Convex (`convex`)

The invite API uses `getToken({ template: "convex" })`. Convex expects a JWT from Clerk with the configured issuer.

1. In Clerk Dashboard → **JWT Templates** (or **Configure** → **JWT Templates**).
2. Create or edit a template named **`convex`** (name must match exactly).
3. Follow [Convex + Clerk docs](https://docs.convex.dev/auth/clerk) for claims / audience if your dashboard shows required fields.

- [ ] JWT template **`convex`** exists and is named exactly `convex`.

---

## 5. Clerk — webhook → Convex (not Vercel)

User sync runs in Convex when Clerk sends `user.created` / `user.updated`.

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**.
2. **Endpoint URL:**

   ```
   https://YOUR_DEPLOYMENT.convex.site/clerk-webhook
   ```

   Replace `YOUR_DEPLOYMENT` with the slug from Convex (same as in `npx convex deploy` / dashboard).

3. Subscribe to events:
   - `user.created`
   - `user.updated`

4. Copy the **Signing secret** (`whsec_...`).

5. Put that secret in **Convex Production** env as `CLERK_WEBHOOK_SECRET` (step 3).  
   For **local** dev you can also put it in `.env.local` as `CLERK_WEBHOOK_SECRET` if you test webhooks against dev — optional.

- [ ] Webhook URL uses **`.convex.site`**, not your Vercel URL.
- [ ] Events subscribed.
- [ ] Secret stored in **Convex** production env.

**Do not** rely on putting `CLERK_WEBHOOK_SECRET` on Vercel for this app — the webhook handler lives in Convex.

---

## 6. Clerk — URLs for your Vercel deployment

After you have a Vercel URL (step 9), come back and add:

1. **Allowed origins / frontend API** — add:
   - Production: `https://your-domain.com` (and `https://www...` if used)
   - Vercel preview: `https://*.vercel.app` (or specific preview URLs)

2. **Redirect URLs** — allow sign-in/sign-up redirects for those same hosts.

- [ ] Production + preview URLs added in Clerk.

---

## 7. Resend — transactional email (invites)

Used by `lib/email.ts` from the Next.js route `POST /api/invite`.

1. Create an API key in Resend.
2. **Verify** the domain (or use Resend’s test sender only in non-prod).
3. Set `EMAIL_FROM` to an address on a **verified** domain, e.g.  
   `CT Championship Series <noreply@yourverifieddomain.com>`.

- [ ] `RESEND_API_KEY` ready for Vercel.
- [ ] `EMAIL_FROM` matches a verified sender.

---

## 8. Optional — clean Convex data before go-live

Only if production has test/seed data you do not want live.

- **`seed:clearData`** — removes seeded league data and seed users (`clerkId` prefix `seed_player_`); does not remove real Clerk-linked users. Run via Convex dashboard **Functions** or CLI against **production** only if you understand the impact:

  ```bash
  npx convex run seed:clearData --prod
  ```

- **`seed:purgeAllData`** — **destructive**: wipes all tables including **real** users. Use only for a true fresh start:

  ```bash
  npx convex run seed:purgeAllData --prod
  ```

- [ ] Chosen **clear** vs **purge** vs **leave data** intentionally.

After purge, you will need to re-create seasons/events/courses via admin (or run seed on an empty DB if appropriate).

---

## 9. Vercel — new project and Git connection

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** your Git repository.
3. Framework: **Next.js** (auto-detected).
4. Root directory: repository root (unless you use a monorepo subfolder).
5. Build command: `npm run build` (default).
6. Output: Next.js default.

- [ ] Project created and linked to the correct repo/branch.

---

## 10. Vercel — environment variables (Production)

In Vercel → Project → **Settings** → **Environment Variables** → scope **Production** (add **Preview** too if you want previews to work with Clerk/Convex).

| Variable | Value / notes |
|----------|----------------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://YOUR_DEPLOYMENT.convex.cloud` (**production** Convex URL from step 2). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk — same environment (dev vs prod) as your secret key. |
| `CLERK_SECRET_KEY` | From Clerk — **Secret** key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL, e.g. `https://your-domain.com` (used for sitemap/robots). For first deploy you can use the `https://your-app.vercel.app` URL, then update when the custom domain is live. |
| `RESEND_API_KEY` | From Resend. |
| `EMAIL_FROM` | Verified sender string (see step 7). |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional — only if you use web push. |

**Optional / usually not required on Vercel for this app:**

- `CONVEX_DEPLOYMENT` — only if you use it in scripts/CI; the app reads `NEXT_PUBLIC_CONVEX_URL`.
- **`CLERK_WEBHOOK_SECRET`** — **not** used by the Next.js app for the Clerk→Convex webhook (webhook is handled in Convex). Omit on Vercel unless you add separate Next.js webhook routes that need it.
- **`CLERK_JWT_ISSUER_DOMAIN`** — set on **Convex**, not Vercel.

- [ ] All required variables set for **Production**.
- [ ] Preview environment variables set if you use preview deployments with real auth.

---

## 11. Vercel — deploy

1. Click **Deploy** (or push to the connected branch).
2. Wait for the build to finish.
3. Open the **deployment URL**.

- [ ] Build green.
- [ ] Site loads.

---

## 12. Custom domain (optional)

1. Vercel → Project → **Settings** → **Domains** → add `yourdomain.com` / `www`.
2. Add DNS records as Vercel instructs.
3. Update **`NEXT_PUBLIC_SITE_URL`** in Vercel to the canonical `https://...` URL.
4. Update Clerk allowed origins and redirect URLs (step 6).

- [ ] DNS propagated and HTTPS works.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the canonical domain.

---

## 13. First-user and super admin

1. Sign in on the **production** URL so Clerk creates a user.
2. Confirm the Convex **users** table gets a row (webhook working).
3. Grant **super admin** using a method you trust:
   - Admin UI in your app (if it can set `isSuperAdmin`), or
   - A one-off Convex mutation / dashboard edit — **avoid** relying on arbitrary “first user” ordering in production.

The repo includes `seed:promoteSuperAdmin`, which promotes an arbitrary first user — **not recommended** for production without verifying who that user is.

- [ ] At least one trusted super admin exists in production.

---

## 14. Final smoke tests (production)

Run through on the **live** URL:

- [ ] **Sign in / sign up** works.
- [ ] Public pages: home, leaderboard, events, players, history, live (as applicable).
- [ ] **Admin** (as super admin): loads without redirect loops.
- [ ] **Invite** (super admin): `POST /api/invite` path works — Clerk invitation created; branded email arrives (Resend) or Clerk email still works if Resend fails.
- [ ] **`/sitemap.xml`** and **`/robots.txt`** — URLs look correct for `NEXT_PUBLIC_SITE_URL`.
- [ ] **Webhook** — update user in Clerk or create a test user; Convex `users` updates.

---

## 15. “Final push” checklist

- [ ] All changes committed and pushed to the branch Vercel deploys from.
- [ ] Vercel **latest deployment** is **Ready**.
- [ ] No secrets committed (only `.env.example` in repo, not `.env.local`).
- [ ] Convex production env complete (`CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`).
- [ ] Clerk webhook URL = `https://YOUR_DEPLOYMENT.convex.site/clerk-webhook`.

You are done when steps 13–15 pass on the URL your players will use.

---

## Troubleshooting (quick)

| Symptom | Likely cause |
|---------|----------------|
| Build fails on Convex fetch | Wrong/missing `NEXT_PUBLIC_CONVEX_URL`, or Convex offline; Vercel build needs network. |
| Signed in but Convex queries unauthorized | JWT template `convex` missing/wrong; or `CLERK_JWT_ISSUER_DOMAIN` on Convex does not match Clerk instance on Vercel. |
| Users never appear in Convex | Webhook URL wrong (must be `.convex.site/clerk-webhook`); or `CLERK_WEBHOOK_SECRET` mismatch; or wrong Clerk environment. |
| Invite email never arrives | Unverified `EMAIL_FROM` domain in Resend; or missing `RESEND_API_KEY` on Vercel. |
| Wrong links in sitemap/robots | `NEXT_PUBLIC_SITE_URL` not set or still pointing at localhost / preview URL. |

---

## Reference — where things live in the repo

| Concern | Location |
|---------|-----------|
| Clerk webhook (HTTP) | `convex/http.ts` |
| Convex auth config | `convex/auth.config.ts` |
| Invite API | `app/api/invite/route.ts` |
| Resend email | `lib/email.ts` |
| Public vs protected routes | `middleware.ts` |
| Env template | `.env.example` |
| Seed / purge | `convex/seed.ts` |

Good luck with the launch.
