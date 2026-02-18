"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePreloadedQuery, useQuery, Preloaded } from "convex/react";
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

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="mt-4 flex justify-center gap-4">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <p className="font-serif text-2xl font-bold text-dark-green">
            {String(unit.value).padStart(2, "0")}
          </p>
          <p className="text-xs font-medium uppercase tracking-wider text-dark-green/50">
            {unit.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function getTimeLeft(dateStr: string) {
  const diff = new Date(dateStr + "T08:00:00").getTime() - Date.now();
  if (diff <= 0)
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

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
      className="flex items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

const POSITION_STYLES = [
  "text-gold font-bold",
  "text-dark-green/70 font-semibold",
  "text-dark-green/50 font-semibold",
];

const FORMAT_LABELS: Record<string, string> = {
  stroke: "Stroke Play",
  match: "Match Play",
  bestBall: "Best Ball",
  scramble: "Scramble",
  stableford: "Stableford",
  skins: "Skins",
};

function formatRelToPar(relToPar: number) {
  if (relToPar === 0) return "E";
  return relToPar > 0 ? `+${relToPar}` : String(relToPar);
}

function LiveLeaderboard({ eventId }: { eventId: Id<"events"> }) {
  const leaderboard = useQuery(api.rounds.getLiveLeaderboard, { eventId });

  if (leaderboard === undefined) {
    return <p className="py-8 text-center text-sm text-dark-green/50">Loading live scores...</p>;
  }

  if (leaderboard.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-dark-green/50">
        No rounds in progress yet. Check back when play begins.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand text-left">
            <th className="px-3 py-2 font-semibold text-dark-green">Pos</th>
            <th className="px-3 py-2 font-semibold text-dark-green">Player</th>
            <th className="px-3 py-2 text-center font-semibold text-dark-green">
              Thru
            </th>
            <th className="px-3 py-2 text-center font-semibold text-dark-green">
              Today
            </th>
            <th className="px-3 py-2 text-center font-semibold text-dark-green">
              Gross
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map(({ round, user }, idx) => {
            const relStr = formatRelToPar(round.relToPar);
            const relColor =
              round.relToPar < 0
                ? "text-birdie-red"
                : round.relToPar > 0
                  ? "text-dark-green/60"
                  : "text-dark-green";

            return (
              <tr
                key={round._id}
                className={`border-b border-sand/50 ${
                  idx === 0
                    ? "bg-gold/10"
                    : idx % 2 === 0
                      ? "bg-cream/50"
                      : ""
                }`}
              >
                <td className="px-3 py-2.5 font-semibold text-dark-green">
                  {idx + 1}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar
                      name={user?.name ?? "?"}
                      photo={user?.photo}
                      size={32}
                    />
                    <div>
                      <p className="font-medium text-dark-green">
                        {user?.name ?? "Unknown"}
                      </p>
                      {round.status === "completed" && (
                        <span className="text-xs text-dark-green/40">F</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-dark-green/70">
                  {round.status === "completed" ? "F" : round.currentHole - 1}
                </td>
                <td
                  className={`px-3 py-2.5 text-center font-semibold ${relColor}`}
                >
                  {relStr}
                </td>
                <td className="px-3 py-2.5 text-center text-dark-green/70">
                  {round.totalScore}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HomeContent({
  preloadedSeason,
  preloadedStandings,
  preloadedEvents,
}: {
  preloadedSeason: Preloaded<typeof api.seasons.getActiveSeason>;
  preloadedStandings: Preloaded<typeof api.standings.getSeasonStandings>;
  preloadedEvents: Preloaded<typeof api.events.getSeasonEvents>;
}) {
  const season = usePreloadedQuery(preloadedSeason);
  const standings = usePreloadedQuery(preloadedStandings);
  const events = usePreloadedQuery(preloadedEvents);

  const top3 = standings.slice(0, 3);

  const activeEvent = events.find((e) => e.event.status === "active");

  const upcomingEntry = events
    .filter(
      (e) => e.event.status === "upcoming" || e.event.status === "active"
    )
    .sort((a, b) => a.event.date.localeCompare(b.event.date))[0];

  const recentResults = events
    .filter((e) => e.event.status === "completed")
    .sort((a, b) => b.event.date.localeCompare(a.event.date))
    .slice(0, 3);

  // Live mode: on if override is "on", or if there's an active event and override isn't "off"
  const liveOverride = season?.liveOverride;
  const isLiveMode =
    liveOverride === "on" ||
    (!!activeEvent && liveOverride !== "off");

  // Hero image: use the active/upcoming event's course heroImage
  const heroEntry = activeEvent ?? upcomingEntry;
  const heroImage =
    heroEntry?.course?.heroImage ?? "/images/default-hero.jpg";

  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-green/80 via-dark-green/60 to-midnight/90" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          {isLiveMode && (
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
                </span>
                Live
              </span>
            </motion.div>
          )}

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-gold/80"
          >
            {season?.name ?? "Season"}
          </motion.p>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-4 font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl lg:text-7xl"
          >
            The Connecticut{" "}
            <span className="text-gold">Championship</span>
            <br />
            Series
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-6 text-lg text-cream/60"
          >
            Your private tour experience
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/leaderboard"
              className="rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-dark-green transition-colors hover:bg-gold-dark"
            >
              View Leaderboard
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-cream/30 px-8 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream hover:bg-cream/10"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Content Sections */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {isLiveMode && activeEvent ? (
          /* ---- LIVE MODE ---- */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-xl font-bold text-dark-green">
                    Live Leaderboard
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-fairway/10 px-2.5 py-0.5 text-xs font-semibold text-fairway">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fairway" />
                    LIVE
                  </span>
                </div>
                <Link
                  href={`/live/${activeEvent.event._id}`}
                  className="text-xs font-semibold text-augusta hover:text-deep-green"
                >
                  Full View →
                </Link>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-dark-green/60">
                <span>{activeEvent.event.name}</span>
                <span>·</span>
                <span>{activeEvent.course?.name ?? "TBD"}</span>
                <span>·</span>
                <span>
                  {FORMAT_LABELS[activeEvent.event.format] ??
                    activeEvent.event.format}
                </span>
                {activeEvent.event.isMajor && (
                  <span className="rounded-full bg-azalea/10 px-2 py-0.5 text-xs font-semibold text-azalea">
                    MAJOR
                  </span>
                )}
              </div>

              <div className="mt-4">
                <LiveLeaderboard
                  eventId={activeEvent.event._id as Id<"events">}
                />
              </div>
            </div>

            {/* Season standings below live leaderboard */}
            {top3.length > 0 && (
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-dark-green">
                    Season Standings
                  </h2>
                  <Link
                    href="/leaderboard"
                    className="text-xs font-semibold text-augusta hover:text-deep-green"
                  >
                    View Full →
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {top3.map((entry, idx) => (
                    <div
                      key={entry.standing._id}
                      className="flex items-center gap-3"
                    >
                      <span
                        className={`w-6 text-center font-serif text-lg ${POSITION_STYLES[idx]}`}
                      >
                        {entry.standing.rank}
                      </span>
                      <PlayerAvatar
                        name={entry.user?.name ?? "?"}
                        photo={entry.user?.photo}
                        size={36}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-dark-green">
                          {entry.user?.name ?? "Unknown"}
                        </p>
                      </div>
                      <p className="font-serif text-lg font-bold text-dark-green">
                        {entry.standing.totalPoints}
                        <span className="ml-0.5 text-xs font-normal text-dark-green/40">
                          pts
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ---- NORMAL MODE ---- */
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid gap-8 lg:grid-cols-2"
            >
              {/* Mini Leaderboard */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-dark-green">
                    Leaderboard
                  </h2>
                  <Link
                    href="/leaderboard"
                    className="text-xs font-semibold text-augusta hover:text-deep-green"
                  >
                    View Full →
                  </Link>
                </div>

                {top3.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {top3.map((entry, idx) => (
                      <div
                        key={entry.standing._id}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`w-6 text-center font-serif text-lg ${POSITION_STYLES[idx]}`}
                        >
                          {entry.standing.rank}
                        </span>
                        <PlayerAvatar
                          name={entry.user?.name ?? "?"}
                          photo={entry.user?.photo}
                          size={36}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-dark-green">
                            {entry.user?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-dark-green/50">
                            {entry.standing.wins} win
                            {entry.standing.wins !== 1 ? "s" : ""} · Avg{" "}
                            {entry.standing.scoringAverage > 0
                              ? entry.standing.scoringAverage.toFixed(1)
                              : "—"}
                          </p>
                        </div>
                        <p className="font-serif text-lg font-bold text-dark-green">
                          {entry.standing.totalPoints}
                          <span className="ml-0.5 text-xs font-normal text-dark-green/40">
                            pts
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-dark-green/50">
                    No standings yet this season.
                  </p>
                )}
              </motion.div>

              {/* Next Upcoming Event */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-dark-green">
                    Next Event
                  </h2>
                  <Link
                    href="/events"
                    className="text-xs font-semibold text-augusta hover:text-deep-green"
                  >
                    All Events →
                  </Link>
                </div>

                {upcomingEntry ? (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl font-bold text-dark-green">
                        {upcomingEntry.event.name}
                      </h3>
                      {upcomingEntry.event.isMajor && (
                        <span className="rounded-full bg-azalea/10 px-2.5 py-0.5 text-xs font-semibold text-azalea">
                          MAJOR
                        </span>
                      )}
                      {upcomingEntry.event.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-fairway/10 px-2.5 py-0.5 text-xs font-semibold text-fairway">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fairway" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-dark-green/60">
                      {upcomingEntry.course?.name ?? "TBD"} ·{" "}
                      {FORMAT_LABELS[upcomingEntry.event.format] ??
                        upcomingEntry.event.format}
                    </p>
                    <p className="mt-1 text-sm font-medium text-dark-green/80">
                      {new Date(
                        upcomingEntry.event.date + "T12:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {upcomingEntry.event.status === "upcoming" && (
                      <CountdownTimer targetDate={upcomingEntry.event.date} />
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-dark-green/50">
                    No upcoming events scheduled.
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Recent Results */}
            {recentResults.length > 0 && (
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="mt-8"
              >
                <motion.h2
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="font-serif text-lg font-bold text-dark-green"
                >
                  Recent Results
                </motion.h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentResults.map(({ event, course }) => (
                    <motion.div
                      key={event._id}
                      variants={fadeUp}
                      transition={{ duration: 0.5 }}
                    >
                      <Link
                        href={`/events/${event._id}`}
                        className="block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-dark-green/40">
                            #{event.eventNumber}
                          </span>
                          <h3 className="font-semibold text-dark-green">
                            {event.name}
                          </h3>
                          {event.isMajor && (
                            <span className="rounded-full bg-azalea/10 px-2 py-0.5 text-xs font-semibold text-azalea">
                              MAJOR
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-dark-green/60">
                          {course?.name ?? "TBD"} ·{" "}
                          {new Date(
                            event.date + "T12:00:00"
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="mt-2 text-xs font-medium text-augusta">
                          View Results →
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
