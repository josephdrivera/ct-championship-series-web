"use client";

import { useState } from "react";
import Image from "next/image";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

function PlayerAvatar({
  name,
  photo,
  size = 40,
}: {
  name: string;
  photo?: string;
  size?: number;
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
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-gold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

interface HistoryContentProps {
  preloadedChampions: Preloaded<typeof api.history.getChampionCards>;
  preloadedMajorWinners: Preloaded<typeof api.history.getMajorWinners>;
  preloadedRecords: Preloaded<typeof api.history.getAllTimeRecords>;
  preloadedSeasons: Preloaded<typeof api.seasons.getAllSeasons>;
}

export default function HistoryContent({
  preloadedChampions,
  preloadedMajorWinners,
  preloadedRecords,
  preloadedSeasons,
}: HistoryContentProps) {
  const champions = usePreloadedQuery(preloadedChampions);
  const majorWinners = usePreloadedQuery(preloadedMajorWinners);
  const records = usePreloadedQuery(preloadedRecords);
  const allSeasons = usePreloadedQuery(preloadedSeasons);

  const [selectedSeasonId, setSelectedSeasonId] =
    useState<Id<"seasons"> | null>(null);

  const seasonStandings = useQuery(
    api.standings.getSeasonStandings,
    selectedSeasonId ? { seasonId: selectedSeasonId } : "skip"
  );

  const completedSeasons = allSeasons.filter((s) => s.status === "completed");

  return (
    <main className="min-h-[calc(100vh-64px)] bg-midnight">
      {/* ── Hero Header ── */}
      <section className="px-4 pb-16 pt-20 text-center sm:pb-24 sm:pt-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-gold/70"
          >
            CT Championship Series
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-4 font-serif text-5xl font-bold tracking-tight text-gold sm:text-6xl lg:text-7xl"
          >
            Hall of Fame
          </motion.h1>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-6 h-px w-24 bg-gold/30"
          />

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-6 text-lg text-cream/50"
          >
            Celebrating excellence across every season
          </motion.p>
        </motion.div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* ── Season Champions ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl font-bold text-gold"
          >
            Season Champions
          </motion.h2>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-1 h-px w-16 bg-gold/30"
          />

          {champions.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {champions.map((entry) => (
                <motion.div
                  key={entry.season._id}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl border-2 border-gold/30 bg-dark-green/40 p-6 text-center backdrop-blur-sm"
                >
                  <p className="font-serif text-4xl font-bold text-gold">
                    {entry.season.year}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-cream/40">
                    {entry.season.name}
                  </p>

                  {entry.champion ? (
                    <>
                      <div className="mx-auto mt-5 flex justify-center">
                        <PlayerAvatar
                          name={entry.champion.name}
                          photo={entry.champion.photo}
                          size={64}
                        />
                      </div>
                      <h3 className="mt-3 font-serif text-xl font-bold text-cream">
                        {entry.champion.name}
                      </h3>
                    </>
                  ) : (
                    <p className="mt-5 text-sm text-cream/40">
                      No champion designated
                    </p>
                  )}

                  {entry.standing && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-2xl font-bold text-gold">
                          {entry.standing.totalPoints}
                        </p>
                        <p className="text-xs text-cream/40">Points</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gold">
                          {entry.standing.wins}
                        </p>
                        <p className="text-xs text-cream/40">Wins</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gold">
                          {entry.standing.eventsPlayed}
                        </p>
                        <p className="text-xs text-cream/40">Events</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gold">
                          {entry.standing.scoringAverage > 0
                            ? entry.standing.scoringAverage.toFixed(1)
                            : "—"}
                        </p>
                        <p className="text-xs text-cream/40">Avg Score</p>
                      </div>
                    </div>
                  )}

                  <p className="mt-4 text-xs text-cream/30">
                    {entry.completedEvents} event
                    {entry.completedEvents !== 1 ? "s" : ""} played
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-cream/40">
              No season champions yet. Check back after the first completed
              season.
            </p>
          )}
        </motion.section>

        {/* ── Major Winners ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl font-bold text-gold"
          >
            Major Winners
          </motion.h2>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-1 h-px w-16 bg-gold/30"
          />

          {majorWinners.length > 0 ? (
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-8 overflow-x-auto"
            >
              {/* Desktop table */}
              <table className="hidden w-full sm:table">
                <thead>
                  <tr className="border-b border-gold/20 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                      Season
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                      Event
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                      Course
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                      Winner
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-cream/50">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {majorWinners.map((entry, idx) => (
                    <tr
                      key={`${entry.event.name}-${entry.event.date}`}
                      className={`border-b border-gold/10 ${
                        idx % 2 === 0 ? "bg-dark-green/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-serif text-sm font-semibold text-gold">
                        {entry.season?.year ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-cream">
                            {entry.event.name}
                          </span>
                          <span className="rounded-full bg-azalea/20 px-2 py-0.5 text-[10px] font-semibold text-azalea">
                            MAJOR
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-cream/60">
                        {entry.course?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.winner && (
                            <PlayerAvatar
                              name={entry.winner.name}
                              photo={entry.winner.photo}
                              size={28}
                            />
                          )}
                          <span className="text-sm font-medium text-cream">
                            {entry.winner?.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-serif text-sm font-bold text-gold">
                        {entry.score.gross}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="space-y-4 sm:hidden">
                {majorWinners.map((entry) => (
                  <div
                    key={`${entry.event.name}-${entry.event.date}`}
                    className="rounded-xl border border-gold/20 bg-dark-green/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-sm font-semibold text-gold">
                        {entry.season?.year ?? "—"}
                      </span>
                      <span className="rounded-full bg-azalea/20 px-2 py-0.5 text-[10px] font-semibold text-azalea">
                        MAJOR
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-cream">
                      {entry.event.name}
                    </p>
                    <p className="text-xs text-cream/50">
                      {entry.course?.name ?? "—"}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {entry.winner && (
                          <PlayerAvatar
                            name={entry.winner.name}
                            photo={entry.winner.photo}
                            size={24}
                          />
                        )}
                        <span className="text-sm text-cream">
                          {entry.winner?.name ?? "—"}
                        </span>
                      </div>
                      <span className="font-serif text-lg font-bold text-gold">
                        {entry.score.gross}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <p className="mt-8 text-sm text-cream/40">
              No major events completed yet.
            </p>
          )}
        </motion.section>

        {/* ── All-Time Records ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl font-bold text-gold"
          >
            All-Time Records
          </motion.h2>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-1 h-px w-16 bg-gold/30"
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Most Wins */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-gold/20 bg-dark-green/30 p-6 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">
                Most Wins
              </p>
              <p className="mt-3 font-serif text-4xl font-bold text-gold">
                {records.mostWins.count || "—"}
              </p>
              {records.mostWins.user && (
                <div className="mt-4">
                  <div className="mx-auto flex justify-center">
                    <PlayerAvatar
                      name={records.mostWins.user.name}
                      photo={records.mostWins.user.photo}
                      size={40}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-cream">
                    {records.mostWins.user.name}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Lowest Round */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-gold/20 bg-dark-green/30 p-6 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">
                Lowest Round
              </p>
              <p className="mt-3 font-serif text-4xl font-bold text-gold">
                {records.lowestRound.gross || "—"}
              </p>
              {records.lowestRound.user && (
                <div className="mt-4">
                  <div className="mx-auto flex justify-center">
                    <PlayerAvatar
                      name={records.lowestRound.user.name}
                      photo={records.lowestRound.user.photo}
                      size={40}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-cream">
                    {records.lowestRound.user.name}
                  </p>
                  {records.lowestRound.course && (
                    <p className="mt-1 text-xs text-cream/40">
                      {records.lowestRound.course.name} (Par{" "}
                      {records.lowestRound.course.par})
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Most Season Points */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-gold/20 bg-dark-green/30 p-6 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">
                Most Season Points
              </p>
              <p className="mt-3 font-serif text-4xl font-bold text-gold">
                {records.mostSeasonPoints.totalPoints || "—"}
              </p>
              {records.mostSeasonPoints.user && (
                <div className="mt-4">
                  <div className="mx-auto flex justify-center">
                    <PlayerAvatar
                      name={records.mostSeasonPoints.user.name}
                      photo={records.mostSeasonPoints.user.photo}
                      size={40}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-cream">
                    {records.mostSeasonPoints.user.name}
                  </p>
                  {records.mostSeasonPoints.season && (
                    <p className="mt-1 text-xs text-cream/40">
                      {records.mostSeasonPoints.season.year}{" "}
                      {records.mostSeasonPoints.season.name}
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Most Birdies */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-gold/20 bg-dark-green/30 p-6 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">
                Most Birdies
              </p>
              <p className="mt-3 font-serif text-4xl font-bold text-gold">
                {records.mostBirdies.count || "—"}
              </p>
              {records.mostBirdies.user && (
                <div className="mt-4">
                  <div className="mx-auto flex justify-center">
                    <PlayerAvatar
                      name={records.mostBirdies.user.name}
                      photo={records.mostBirdies.user.photo}
                      size={40}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-cream">
                    {records.mostBirdies.user.name}
                  </p>
                  <p className="mt-1 text-xs text-cream/40">Career total</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Past Standings ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-serif text-3xl font-bold text-gold"
          >
            Past Standings
          </motion.h2>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-1 h-px w-16 bg-gold/30"
          />

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            {completedSeasons.length > 0 ? (
              <>
                <select
                  value={selectedSeasonId ?? ""}
                  onChange={(e) =>
                    setSelectedSeasonId(
                      e.target.value
                        ? (e.target.value as Id<"seasons">)
                        : null
                    )
                  }
                  className="w-full rounded-lg border border-gold/30 bg-dark-green/50 px-4 py-3 font-serif text-cream focus:border-gold focus:outline-none sm:w-auto"
                >
                  <option value="">Select a season…</option>
                  {completedSeasons.map((season) => (
                    <option key={season._id} value={season._id}>
                      {season.year} — {season.name}
                    </option>
                  ))}
                </select>

                {selectedSeasonId && (
                  <div className="mt-6">
                    {seasonStandings === undefined ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-12 animate-pulse rounded-lg bg-dark-green/30"
                          />
                        ))}
                      </div>
                    ) : seasonStandings.length === 0 ? (
                      <p className="text-sm text-cream/40">
                        No standings recorded for this season.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gold/20 text-left">
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                                Rank
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cream/50">
                                Player
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-cream/50">
                                Points
                              </th>
                              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-cream/50 sm:table-cell">
                                Wins
                              </th>
                              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-cream/50 sm:table-cell">
                                Events
                              </th>
                              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-cream/50 md:table-cell">
                                Avg Score
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {seasonStandings.map((entry, idx) => (
                              <tr
                                key={entry.standing._id}
                                className={`border-b border-gold/10 ${
                                  idx === 0
                                    ? "bg-gold/10"
                                    : idx % 2 === 0
                                      ? "bg-dark-green/20"
                                      : ""
                                }`}
                              >
                                <td className="px-4 py-3 font-serif text-sm font-bold text-gold">
                                  {entry.standing.rank}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <PlayerAvatar
                                      name={entry.user?.name ?? "?"}
                                      photo={entry.user?.photo}
                                      size={32}
                                    />
                                    <span className="text-sm font-medium text-cream">
                                      {entry.user?.name ?? "Unknown"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-serif text-sm font-bold text-gold">
                                  {entry.standing.totalPoints}
                                </td>
                                <td className="hidden px-4 py-3 text-right text-sm text-cream/70 sm:table-cell">
                                  {entry.standing.wins}
                                </td>
                                <td className="hidden px-4 py-3 text-right text-sm text-cream/70 sm:table-cell">
                                  {entry.standing.eventsPlayed}
                                </td>
                                <td className="hidden px-4 py-3 text-right text-sm text-cream/70 md:table-cell">
                                  {entry.standing.scoringAverage > 0
                                    ? entry.standing.scoringAverage.toFixed(1)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-cream/40">
                No completed seasons yet. Past standings will appear here after
                a season is completed.
              </p>
            )}
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
