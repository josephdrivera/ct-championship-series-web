"use client";

import Link from "next/link";
import Image from "next/image";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const FORMAT_LABELS: Record<string, string> = {
  stroke: "Stroke Play",
  match: "Match Play",
  bestBall: "Best Ball",
  scramble: "Scramble",
  stableford: "Stableford",
  skins: "Skins",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-fairway/10 px-2.5 py-1 text-xs font-semibold text-fairway ring-1 ring-fairway/30">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fairway" />
        LIVE
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-dark-green/70">
        Upcoming
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="rounded-full bg-dark-green/10 px-2.5 py-1 text-xs font-medium text-dark-green/70">
        Completed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-dark-green/40">
      Canceled
    </span>
  );
}

interface EventsContentProps {
  preloadedSeason: Preloaded<typeof api.seasons.getActiveSeason>;
  preloadedEvents: Preloaded<typeof api.events.getSeasonEvents>;
}

export default function EventsContent({
  preloadedSeason,
  preloadedEvents,
}: EventsContentProps) {
  const season = usePreloadedQuery(preloadedSeason);
  const events = usePreloadedQuery(preloadedEvents);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
            Events
          </h1>
          {season && (
            <p className="mt-1 text-dark-green/60">{season.name} Season</p>
          )}
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg text-dark-green/60">
              No events scheduled yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map(({ event, course, imageUrl }) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Course photo */}
                {imageUrl && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`${course?.name ?? event.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                {/* Top row: Event number label + badges */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-dark-green/40">
                    Event {event.eventNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    {event.isMajor && (
                      <span className="rounded-full bg-azalea px-2.5 py-1 text-xs font-semibold text-white">
                        MAJOR
                      </span>
                    )}
                    <span className="rounded-full bg-augusta/10 px-2.5 py-1 text-xs font-medium text-augusta">
                      {FORMAT_LABELS[event.format] ?? event.format}
                    </span>
                  </div>
                </div>

                {/* Event name + status */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <h2 className="font-serif text-xl font-bold text-dark-green transition-colors group-hover:text-augusta">
                    {event.name}
                  </h2>
                  <StatusBadge status={event.status} />
                </div>

                {/* Course name */}
                <p className="mt-1 text-sm font-medium text-dark-green/70">
                  {course?.name ?? "TBD"}
                </p>

                {/* Date */}
                <p className="mt-1 text-sm text-dark-green/50">
                  {new Date(event.date + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>

                {/* Footer: par + multiplier + location */}
                <div className="mt-4 flex items-center gap-4 border-t border-sand pt-4 text-xs text-dark-green/50">
                  {course && <span>Par {course.par}</span>}
                  {event.multiplier > 1 && (
                    <span className="font-semibold text-azalea">
                      {event.multiplier}x Points
                    </span>
                  )}
                  {course?.location && (
                    <span className="ml-auto">{course.location}</span>
                  )}
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
