"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatPoints } from "@/lib/format";
import Image from "next/image";

function PlayerAvatar({
  name,
  photo,
  size,
}: {
  name: string;
  photo?: string;
  size: "sm" | "lg";
}) {
  const dimension = size === "lg" ? 64 : 32;
  const sizeClasses =
    size === "lg"
      ? "h-16 w-16 rounded-full text-xl"
      : "h-8 w-8 rounded-full text-xs";

  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={dimension}
        height={dimension}
        className={`${sizeClasses} object-cover`}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center bg-augusta font-semibold text-cream`}
    >
      {initials}
    </div>
  );
}

function CrownIcon() {
  return (
    <svg
      className="h-8 w-8 text-gold"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
    </svg>
  );
}

interface LeaderboardContentProps {
  preloadedSeason: Preloaded<typeof api.seasons.getActiveSeason>;
  preloadedStandings: Preloaded<typeof api.standings.getSeasonStandings>;
}

export default function LeaderboardContent({
  preloadedSeason,
  preloadedStandings,
}: LeaderboardContentProps) {
  const season = usePreloadedQuery(preloadedSeason);
  const standings = usePreloadedQuery(preloadedStandings);

  const leader = standings.length > 0 ? standings[0] : null;
  const leaderPoints = leader?.standing.totalPoints ?? 0;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
            Leaderboard
          </h1>
          {season && (
            <p className="mt-1 text-dark-green/60">{season.name} Season</p>
          )}
        </div>

        {standings.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg text-dark-green/60">
              No standings yet. Check back after the first event.
            </p>
          </div>
        ) : (
          <>
            {/* Featured Leader Card */}
            {leader && leader.user && (
              <div className="rounded-2xl bg-gradient-to-r from-dark-green to-midnight p-6 text-cream shadow-lg md:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <CrownIcon />
                  <span className="font-serif text-sm uppercase tracking-widest text-gold">
                    Season Leader
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                  <PlayerAvatar
                    name={leader.user.name}
                    photo={leader.user.photo}
                    size="lg"
                  />
                  <div className="text-center md:text-left">
                    <h2 className="font-serif text-2xl font-bold">
                      {leader.user.name}
                    </h2>
                  </div>
                  <div className="flex gap-8 md:ml-auto">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gold">
                        {formatPoints(leader.standing.totalPoints)}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-cream/60">
                        Points
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {leader.standing.wins}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-cream/60">
                        Wins
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {leader.standing.scoringAverage > 0
                          ? leader.standing.scoringAverage.toFixed(1)
                          : "—"}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-cream/60">
                        Avg Score
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standings Table */}
            <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-dark-green text-cream">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Handicap
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Gap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(({ standing, user }) => {
                    if (!user) return null;
                    const isLeader = standing.rank === 1;
                    const gap = leaderPoints - standing.totalPoints;

                    return (
                      <tr
                        key={user._id}
                        className={
                          isLeader
                            ? "border-b border-sand bg-gold/10 border-l-4 border-l-gold"
                            : "border-b border-sand"
                        }
                      >
                        <td className="px-4 py-3 font-semibold text-dark-green">
                          {standing.rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              name={user.name}
                              photo={user.photo}
                              size="sm"
                            />
                            <span className="font-medium text-dark-green">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green">
                          {standing.wins}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green">
                          {standing.scoringAverage > 0
                            ? standing.scoringAverage.toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green">
                          {user.handicap ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-dark-green">
                          {formatPoints(standing.totalPoints)}
                        </td>
                        <td className="px-4 py-3 text-center text-dark-green/60">
                          {isLeader ? "—" : `−${formatPoints(gap)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
