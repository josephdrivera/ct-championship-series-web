"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";

interface LiveSpectatorContentProps {
  preloadedEvent: Preloaded<typeof api.events.getEventById>;
  preloadedLeaderboard: Preloaded<typeof api.rounds.getLiveLeaderboard>;
}

function formatRelToPar(relToPar: number) {
  if (relToPar === 0) return "E";
  if (relToPar > 0) return `+${relToPar}`;
  return `${relToPar}`;
}

function relToParColor(relToPar: number) {
  if (relToPar < 0) return "text-gold";
  if (relToPar === 0) return "text-fairway";
  return "text-red-400";
}

function PlayerAvatar({
  name,
  photo,
}: {
  name: string;
  photo?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-augusta text-xs font-semibold text-cream">
      {initials}
    </div>
  );
}

function HoleByHoleScorecard({
  liveRoundId,
  courseId,
}: {
  liveRoundId: Id<"liveRounds">;
  courseId: Id<"courses"> | undefined;
}) {
  const holeScores = useQuery(api.rounds.getRoundHoleScores, { liveRoundId });
  const courseHoles = useQuery(
    api.courses.getCourseHoles,
    courseId ? { courseId } : "skip"
  );

  if (!holeScores) {
    return (
      <div className="space-y-2 px-4 py-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3.5 w-8 animate-pulse rounded bg-dark-green/30" />
            <div className="h-3.5 flex-1 animate-pulse rounded bg-dark-green/30" />
            <div className="h-3.5 w-10 animate-pulse rounded bg-dark-green/30" />
          </div>
        ))}
      </div>
    );
  }

  if (holeScores.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-sm text-cream/40">
        No holes completed yet.
      </div>
    );
  }

  // Build par lookup from course holes
  const parByHole: Record<number, number> = {};
  if (courseHoles) {
    for (const h of courseHoles) {
      parByHole[h.holeNumber] = h.par;
    }
  }

  const totalHoles = courseHoles?.length ?? 18;

  return (
    <div className="overflow-x-auto px-4 pb-4">
      <table className="w-full min-w-[500px] text-xs">
        <thead>
          <tr className="text-cream/40">
            <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider">
              Hole
            </th>
            {Array.from({ length: totalHoles }, (_, i) => (
              <th
                key={i + 1}
                className="px-2 py-1.5 text-center font-semibold"
              >
                {i + 1}
              </th>
            ))}
          </tr>
          <tr className="text-cream/50">
            <td className="px-2 py-1 text-left font-medium uppercase tracking-wider">
              Par
            </td>
            {Array.from({ length: totalHoles }, (_, i) => (
              <td key={i + 1} className="px-2 py-1 text-center">
                {parByHole[i + 1] ?? "-"}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="text-cream">
            <td className="px-2 py-1 text-left font-medium uppercase tracking-wider">
              Score
            </td>
            {Array.from({ length: totalHoles }, (_, i) => {
              const hs = holeScores.find((s) => s.holeNumber === i + 1);
              if (!hs) {
                return (
                  <td
                    key={i + 1}
                    className="px-2 py-1 text-center text-cream/20"
                  >
                    -
                  </td>
                );
              }
              return (
                <td
                  key={i + 1}
                  className={`px-2 py-1 text-center font-semibold ${relToParColor(hs.relToPar)}`}
                >
                  {hs.pickedUp ? "PU" : hs.score}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function LiveSpectatorContent({
  preloadedEvent,
  preloadedLeaderboard,
}: LiveSpectatorContentProps) {
  const eventData = usePreloadedQuery(preloadedEvent);
  const leaderboard = usePreloadedQuery(preloadedLeaderboard);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const lastUpdated = useMemo(() => {
    void leaderboard;
    return new Date();
  }, [leaderboard]);

  if (!eventData) return null;

  const { event, course } = eventData;

  const formattedDate = new Date(event.date + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const isNotStarted =
    event.status === "upcoming" ||
    (event.status === "active" && leaderboard.length === 0);
  const isCompleted =
    event.status === "completed" || event.status === "canceled";
  const isLive = event.status === "active" && leaderboard.length > 0;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-dark-green">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-cream/40">
            <li>
              <Link href="/" className="transition-colors hover:text-cream/70">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/events"
                className="transition-colors hover:text-cream/70"
              >
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-cream" aria-current="page">
              Live
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          {isLive && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-fairway/20 px-4 py-1.5 text-sm font-bold text-fairway ring-1 ring-fairway/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-fairway" />
              LIVE NOW
            </span>
          )}
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-cream md:text-4xl">
            {event.name}
          </h1>
          <p className="mt-2 text-lg text-cream/60">
            {course?.name ?? "Course TBD"} &middot; {formattedDate}
          </p>
        </div>

        {/* Not Started State */}
        {isNotStarted && (
          <div className="rounded-2xl border border-cream/10 bg-midnight/50 p-12 text-center">
            <p className="font-serif text-xl font-bold text-cream">
              {event.status === "upcoming"
                ? "Tournament has not started yet"
                : "Waiting for players to begin their rounds"}
            </p>
            <p className="mt-3 text-cream/50">
              Check back when the event is underway for live scoring.
            </p>
            <Link
              href={`/events/${event._id}`}
              className="mt-6 inline-block rounded-full bg-augusta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
            >
              View Event Details
            </Link>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="rounded-2xl border border-cream/10 bg-midnight/50 p-12 text-center">
            <p className="font-serif text-xl font-bold text-cream">
              Tournament Complete
            </p>
            <p className="mt-3 text-cream/50">
              This event has finished. View the final results and scorecard.
            </p>
            <Link
              href={`/events/${event._id}`}
              className="mt-6 inline-block rounded-full bg-augusta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
            >
              See Final Results
            </Link>
          </div>
        )}

        {/* Live Leaderboard */}
        {isLive && (
          <>
            <div className="overflow-hidden rounded-xl border border-cream/10 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-midnight text-cream">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Thru
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Today
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Gross
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <AnimatePresence>
                    <tbody>
                      {leaderboard.map(({ round, user }, index) => {
                        if (!user) return null;
                        const position = index + 1;
                        const isLeader = position === 1;
                        const thru =
                          round.status === "completed"
                            ? "F"
                            : round.currentHole - 1;
                        const net =
                          round.totalScore - (user.handicap ?? 0);
                        const isExpanded =
                          expandedRoundId === round._id;

                        return (
                          <motion.tr
                            key={round._id}
                            layout
                            transition={{
                              layout: { duration: 0.4, ease: "easeInOut" },
                            }}
                            onClick={() =>
                              setExpandedRoundId(
                                isExpanded ? null : round._id
                              )
                            }
                            className={`cursor-pointer border-b border-cream/10 transition-colors hover:bg-cream/5 ${
                              isLeader
                                ? "border-l-4 border-l-gold bg-gold/10"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-cream">
                              {position}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <PlayerAvatar
                                  name={user.name}
                                  photo={user.photo}
                                />
                                <span className="font-medium text-cream">
                                  {user.name}
                                </span>
                                {isLeader && (
                                  <span className="text-xs font-semibold text-gold">
                                    Leader
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-cream/70">
                              {thru}
                            </td>
                            <td
                              className={`px-4 py-3 text-center font-semibold ${relToParColor(round.relToPar)}`}
                            >
                              {formatRelToPar(round.relToPar)}
                            </td>
                            <td className="px-4 py-3 text-center text-cream">
                              {round.totalScore}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-cream">
                              {net}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>

              {/* Expandable scorecard below the table */}
              <AnimatePresence>
                {expandedRoundId && (
                  <motion.div
                    key={expandedRoundId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-cream/10 bg-midnight/50"
                  >
                    <div className="px-4 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">
                        Hole-by-Hole Scorecard
                      </p>
                    </div>
                    <HoleByHoleScorecard
                      liveRoundId={
                        expandedRoundId as Id<"liveRounds">
                      }
                      courseId={course?._id}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Last Updated */}
            <p className="mt-4 text-center text-xs text-cream/40">
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </p>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-cream/10 pt-6 text-center">
          <p className="text-sm text-cream/50">
            Share this link for anyone to spectate
          </p>
        </div>
      </div>
    </main>
  );
}
