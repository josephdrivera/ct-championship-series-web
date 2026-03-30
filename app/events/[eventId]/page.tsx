import type { Metadata } from "next";
import {
  fetchQuery,
  preloadQuery,
  preloadedQueryResult,
} from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import EventDetailContent from "./EventDetailContent";

interface Props {
  params: Promise<{ eventId: string }>;
}

export async function generateStaticParams() {
  const completedEvents = await fetchQuery(api.events.getCompletedEventIds);
  return completedEvents.map(({ eventId }) => ({
    eventId: eventId as string,
  }));
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
  const title = `${event.name} | CT Championship Series`;
  const description = `${event.isMajor ? "MAJOR — " : ""}${event.name} at ${course?.name ?? "TBD"} · ${event.format} play`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;

  const preloadedEvent = await preloadQuery(api.events.getEventById, {
    eventId: eventId as Id<"events">,
  });
  const eventData = preloadedQueryResult(preloadedEvent);

  if (!eventData) {
    notFound();
  }

  const preloadedScores = await preloadQuery(api.scores.getEventScores, {
    eventId: eventId as Id<"events">,
  });

  return (
    <EventDetailContent
      preloadedEvent={preloadedEvent}
      preloadedScores={preloadedScores}
    />
  );
}
