"use client";

import Link from "next/link";
import Image from "next/image";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPoints } from "@/lib/format";
import MyEventScoreForm from "@/components/events/MyEventScoreForm";

const FORMAT_LABELS: Record<string, string> = {
  stroke: "Stroke Play",
  match: "Match Play",
  bestBall: "Best Ball",
  scramble: "Scramble",
  stableford: "Stableford",
  skins: "Skins",
};

interface EventDetailContentProps {
  preloadedEvent: Preloaded<typeof api.events.getEventById>;
  preloadedScores: Preloaded<typeof api.scores.getEventScores>;
}

export default function EventDetailContent({
  preloadedEvent,
  preloadedScores,
}: EventDetailContentProps) {
  const eventData = usePreloadedQuery(preloadedEvent);
  const scores = usePreloadedQuery(preloadedScores);

  if (!eventData) return null;

  const { event, course, imageUrl } = eventData;

  const formattedDate = new Date(event.date + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-dark-green/50">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-dark-green"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/events"
                className="transition-colors hover:text-dark-green"
              >
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-dark-green" aria-current="page">
              {event.name}
            </li>
          </ol>
        </nav>

        {/* Major Banner */}
        {event.isMajor && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-azalea px-6 py-3 text-white">
            <span className="font-serif text-lg font-bold">
              Major Championship
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
              2x Points
            </span>
          </div>
        )}

        {/* Hero Header */}
        <div
          className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-dark-green to-midnight p-8 text-cream shadow-lg"
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover opacity-30"
            />
          )}
          <div className="relative">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold/70">
              Event {event.eventNumber}
            </p>
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
              {event.name}
            </h1>
            <p className="mt-2 text-xl text-cream/70">
              {course?.name ?? "Course TBD"}
            </p>
            {event.status === "active" && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-fairway/20 px-3 py-1 text-xs font-semibold text-fairway ring-1 ring-fairway/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fairway" />
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Info Chips */}
        <div className="mb-8 flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-dark-green shadow-sm">
            {formattedDate}
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-dark-green shadow-sm">
            {FORMAT_LABELS[event.format] ?? event.format}
          </span>
          {course && (
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-dark-green shadow-sm">
              Par {course.par}
            </span>
          )}
          {event.multiplier > 1 && (
            <span className="rounded-full bg-azalea px-4 py-2 text-sm font-semibold text-white shadow-sm">
              {event.multiplier}x Points
            </span>
          )}
        </div>

        {event.status === "active" && (
          <MyEventScoreForm eventId={event._id} />
        )}

        {/* Scorecard Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-sand px-6 py-4">
            <h2 className="font-serif text-xl font-bold text-dark-green">
              {event.status === "completed" ? "Final Results" : "Leaderboard"}
            </h2>
            {event.status === "active" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fairway/10 px-2.5 py-1 text-xs font-semibold text-fairway ring-1 ring-fairway/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fairway" />
                LIVE
              </span>
            )}
          </div>

          {scores.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-dark-green/60">
                {event.status === "upcoming"
                  ? "Scores will appear here once the event is underway."
                  : "No scores recorded for this event."}
              </p>
            </div>
          ) : (() => {
            // Detect tied positions
            const positionCounts = new Map<number, number>();
            for (const { score } of scores) {
              if (score.finishPosition > 0) {
                positionCounts.set(
                  score.finishPosition,
                  (positionCounts.get(score.finishPosition) ?? 0) + 1
                );
              }
            }

            return (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-dark-green text-cream">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Pos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Net
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      +/-
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map(({ score, user }) => {
                    if (!user) return null;
                    const isWinner = score.finishPosition === 1;
                    const relToPar = course
                      ? score.gross - course.par
                      : null;
                    const isTied =
                      score.finishPosition > 0 &&
                      (positionCounts.get(score.finishPosition) ?? 0) > 1;

                    return (
                      <tr
                        key={score._id}
                        className={
                          isWinner
                            ? "border-b border-sand border-l-4 border-l-gold bg-gold/10"
                            : "border-b border-sand"
                        }
                      >
                        <td className="px-4 py-3 font-semibold text-dark-green">
                          {score.finishPosition === 0
                            ? "\u2014"
                            : isTied
                              ? `T${score.finishPosition}`
                              : score.finishPosition}
                        </td>
                        <td className="px-4 py-3 font-medium text-dark-green">
                          {user.name}
                          {isWinner && (
                            <span className="ml-2 text-xs font-semibold text-gold">
                              Winner
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green">
                          {score.gross}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-dark-green">
                          {score.net}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green/70">
                          {relToPar === null
                            ? "\u2014"
                            : relToPar === 0
                              ? "E"
                              : relToPar > 0
                                ? `+${relToPar}`
                                : `${relToPar}`}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-dark-green">
                          {score.pointsEarned > 0
                            ? formatPoints(score.pointsEarned)
                            : "\u2014"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      </div>
    </main>
  );
}
