import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import LeaderboardContent from "./LeaderboardContent";

export const metadata: Metadata = {
  title: "Championship Series Leaderboard",
  description:
    "Live standings, points, and rankings for the CT Championship Series golf league.",
  openGraph: {
    title: "Championship Series Leaderboard",
    description:
      "Live standings, points, and rankings for the CT Championship Series golf league.",
  },
};

export default async function LeaderboardPage() {
  const preloadedSeason = await preloadQuery(api.seasons.getActiveSeason);
  const season = preloadedQueryResult(preloadedSeason);

  if (!season) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-dark-green">
            Leaderboard
          </h1>
          <p className="mt-4 text-dark-green/60">
            No active season at this time. Check back soon.
          </p>
        </div>
      </main>
    );
  }

  const preloadedStandings = await preloadQuery(
    api.standings.getSeasonStandings,
    { seasonId: season._id }
  );

  return (
    <LeaderboardContent
      preloadedSeason={preloadedSeason}
      preloadedStandings={preloadedStandings}
    />
  );
}
