import type { Metadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import EventsContent from "./EventsContent";

export const metadata: Metadata = {
  title: "Events | CT Championship Series",
  description:
    "All events for the CT Championship Series golf league — upcoming, live, and completed.",
  openGraph: {
    title: "Events | CT Championship Series",
    description:
      "All events for the CT Championship Series golf league.",
  },
};

export default async function EventsPage() {
  const preloadedSeason = await preloadQuery(api.seasons.getActiveSeason);
  const season = preloadedQueryResult(preloadedSeason);

  if (!season) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-dark-green">
            Events
          </h1>
          <p className="mt-4 text-dark-green/60">
            No active season at this time. Check back soon.
          </p>
        </div>
      </main>
    );
  }

  const preloadedEvents = await preloadQuery(api.events.getSeasonEvents, {
    seasonId: season._id,
  });

  return (
    <EventsContent
      preloadedSeason={preloadedSeason}
      preloadedEvents={preloadedEvents}
    />
  );
}
