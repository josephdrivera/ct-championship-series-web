import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import PlayersContent from "./PlayersContent";

export const metadata: Metadata = {
  title: "Players | CT Championship Series",
  description:
    "Browse all players in the CT Championship Series golf league — rankings, handicaps, and stats.",
  openGraph: {
    title: "Players | CT Championship Series",
    description:
      "Browse all players in the CT Championship Series golf league.",
  },
};

export default async function PlayersPage() {
  const preloadedPlayers = await preloadQuery(api.players.getAllPlayers);

  const preloadedSeason = await preloadQuery(api.seasons.getActiveSeason);
  const season = preloadedQueryResult(preloadedSeason);

  let standings: Array<{
    standing: {
      userId: string;
      rank: number;
      totalPoints: number;
      wins: number;
      eventsPlayed: number;
    };
  }> = [];

  if (season) {
    const preloadedStandings = await preloadQuery(
      api.standings.getSeasonStandings,
      { seasonId: season._id }
    );
    standings = preloadedQueryResult(preloadedStandings);
  }

  return (
    <PlayersContent
      preloadedPlayers={preloadedPlayers}
      standings={standings}
    />
  );
}
