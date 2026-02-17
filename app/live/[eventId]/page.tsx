import type { Metadata } from "next";
import { fetchQuery, preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import LiveSpectatorContent from "./LiveSpectatorContent";

interface Props {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const result = await fetchQuery(api.events.getEventById, {
    eventId: eventId as Id<"events">,
  });

  if (!result) {
    return { title: "Event Not Found | CT Championship Series" };
  }

  const { event, course } = result;
  const title = `Live: ${event.name} | CT Championship Series`;
  const description = `Watch live scoring for ${event.name} at ${course?.name ?? "TBD"}. Real-time leaderboard for the CT Championship Series.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function LiveSpectatorPage({ params }: Props) {
  const { eventId } = await params;

  const preloadedEvent = await preloadQuery(api.events.getEventById, {
    eventId: eventId as Id<"events">,
  });
  const eventData = preloadedQueryResult(preloadedEvent);

  if (!eventData) {
    notFound();
  }

  const preloadedLeaderboard = await preloadQuery(
    api.rounds.getLiveLeaderboard,
    { eventId: eventId as Id<"events"> }
  );

  return (
    <LiveSpectatorContent
      preloadedEvent={preloadedEvent}
      preloadedLeaderboard={preloadedLeaderboard}
    />
  );
}
