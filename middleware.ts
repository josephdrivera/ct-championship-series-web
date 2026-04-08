import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Routes not listed here require a Clerk session (e.g. /admin, /api/invite). */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/leaderboard(.*)",
  "/events(.*)",
  "/players(.*)",
  "/history(.*)",
  "/live(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
