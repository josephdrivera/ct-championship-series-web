import type { Metadata } from "next";
import {
  fetchQuery,
  preloadQuery,
  preloadedQueryResult,
} from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import PlayerProfileContent from "./PlayerProfileContent";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;

  try {
    const profile = await fetchQuery(api.players.getPlayerProfile, {
      userId: userId as Id<"users">,
    });

    const title = `${profile.user.name} | CT Championship Series`;
    const description = `${profile.user.name} — ${profile.stats.eventsPlayed} events played, ${parseFloat(profile.stats.totalPoints.toFixed(2))} points, ${profile.stats.wins} wins in the CT Championship Series.`;

    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return { title: "Player Not Found | CT Championship Series" };
  }
}

export default async function PlayerProfilePage({ params }: Props) {
  const { userId } = await params;

  let preloadedProfile;
  try {
    preloadedProfile = await preloadQuery(api.players.getPlayerProfile, {
      userId: userId as Id<"users">,
    });
  } catch {
    notFound();
  }

  const profile = preloadedQueryResult(preloadedProfile);
  if (!profile) {
    notFound();
  }

  // Get standings for current rank
  const preloadedSeason = await preloadQuery(api.seasons.getActiveSeason);
  const season = preloadedQueryResult(preloadedSeason);

  let currentRank: number | null = null;
  let totalPlayers = 0;

  if (season) {
    const preloadedStandings = await preloadQuery(
      api.standings.getSeasonStandings,
      { seasonId: season._id }
    );
    const standings = preloadedQueryResult(preloadedStandings);
    totalPlayers = standings.length;
    const playerStanding = standings.find(
      (s) => s.standing.userId === userId
    );
    if (playerStanding) {
      currentRank = playerStanding.standing.rank;
    }
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.user.name,
    description: `Golf league member of the CT Championship Series. ${profile.stats.eventsPlayed} events played, ${profile.stats.wins} wins.`,
    memberOf: {
      "@type": "SportsOrganization",
      name: "CT Championship Series",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlayerProfileContent
        preloadedProfile={preloadedProfile}
        currentRank={currentRank}
        totalPlayers={totalPlayers}
      />
    </>
  );
}
