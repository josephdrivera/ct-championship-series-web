import type { Metadata } from "next";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import HistoryContent from "./HistoryContent";

export const metadata: Metadata = {
  title: "Hall of Fame | CT Championship Series",
  description:
    "Season champions, major winners, all-time records, and past standings for the CT Championship Series.",
  openGraph: {
    title: "Hall of Fame | CT Championship Series",
    description:
      "Season champions, major winners, all-time records, and past standings.",
  },
};

export default async function HistoryPage() {
  const [
    preloadedChampions,
    preloadedMajorWinners,
    preloadedRecords,
    preloadedSeasons,
  ] = await Promise.all([
    preloadQuery(api.history.getChampionCards),
    preloadQuery(api.history.getMajorWinners),
    preloadQuery(api.history.getAllTimeRecords),
    preloadQuery(api.seasons.getAllSeasons),
  ]);

  return (
    <HistoryContent
      preloadedChampions={preloadedChampions}
      preloadedMajorWinners={preloadedMajorWinners}
      preloadedRecords={preloadedRecords}
      preloadedSeasons={preloadedSeasons}
    />
  );
}
