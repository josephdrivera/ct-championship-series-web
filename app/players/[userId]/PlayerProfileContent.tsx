"use client";

import Link from "next/link";
import Image from "next/image";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const KNOWN_ACHIEVEMENTS = [
  { type: "Ace", label: "Hole-in-One" },
  { type: "Eagle", label: "Eagle" },
  { type: "Low Round", label: "Low Round" },
  { type: "Season Champ", label: "Season Champ" },
  { type: "Birdie Streak", label: "Birdie Streak" },
  { type: "Most Improved", label: "Most Improved" },
];

function PlayerAvatar({
  name,
  photo,
  size,
}: {
  name: string;
  photo?: string;
  size: "md" | "lg";
}) {
  const dimension = size === "lg" ? 80 : 48;
  const sizeClasses =
    size === "lg"
      ? "h-20 w-20 rounded-full text-2xl"
      : "h-12 w-12 rounded-full text-sm";

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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold text-dark-green">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-dark-green/50">
        {label}
      </p>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface PlayerProfileContentProps {
  preloadedProfile: Preloaded<typeof api.players.getPlayerProfile>;
  currentRank: number | null;
  totalPlayers: number;
}

export default function PlayerProfileContent({
  preloadedProfile,
  currentRank,
  totalPlayers,
}: PlayerProfileContentProps) {
  const profile = usePreloadedQuery(preloadedProfile);
  const { user, stats, recentScores, achievements } = profile;

  const earnedTypes = new Set(achievements.map((a) => a.type));

  // Build chart data from recent scores (reversed so oldest is first)
  const chartData = [...recentScores]
    .reverse()
    .map((s) => ({
      event: s.event?.name ?? "Event",
      handicap: s.score.handicap,
    }));

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
                href="/players"
                className="transition-colors hover:text-dark-green"
              >
                Players
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-dark-green" aria-current="page">
              {user.name}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-dark-green to-midnight p-8 text-cream shadow-lg">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <PlayerAvatar name={user.name} photo={user.photo} size="lg" />
            <div className="text-center md:text-left">
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {user.name}
              </h1>
              <p className="mt-1 text-cream/60">
                Member since {user.joinedYear}
              </p>
            </div>
            {currentRank && (
              <div className="md:ml-auto text-center">
                <p
                  className={`text-4xl font-bold ${currentRank <= 3 ? "text-gold" : "text-cream"}`}
                >
                  #{currentRank}
                </p>
                <p className="text-xs uppercase tracking-wider text-cream/60">
                  Current Rank
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Points" value={stats.totalPoints} />
          <StatCard
            label="Avg Score"
            value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "\u2014"}
          />
          <StatCard label="Wins" value={stats.wins} />
          <StatCard
            label="Handicap"
            value={user.handicap !== undefined ? user.handicap : "N/A"}
          />
          <StatCard label="Birdies" value={stats.birdies} />
          <StatCard
            label="Standing"
            value={
              currentRank
                ? `${ordinal(currentRank)} of ${totalPlayers}`
                : "\u2014"
            }
          />
        </div>

        {/* Handicap Trend Chart */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-dark-green">
            Handicap Trend
          </h2>
          {chartData.length < 2 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-dark-green/50">
                Not enough data to show trend.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="handicapGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#006747" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#006747" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="event"
                  tick={{ fontSize: 11, fill: "#002E1F80" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#002E1F80" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FDF8F0",
                    border: "1px solid #E8DFD0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="handicap"
                  stroke="#006747"
                  strokeWidth={2}
                  fill="url(#handicapGradient)"
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    const isLast = index === chartData.length - 1;
                    return (
                      <circle
                        key={index}
                        cx={cx}
                        cy={cy}
                        r={isLast ? 5 : 3}
                        fill={isLast ? "#F2C75C" : "#006747"}
                        stroke={isLast ? "#F2C75C" : "#006747"}
                        strokeWidth={isLast ? 2 : 0}
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Achievement Badges */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-dark-green">
            Achievements
          </h2>
          <div className="flex flex-wrap gap-3">
            {KNOWN_ACHIEVEMENTS.map((achievement) => {
              const earned = earnedTypes.has(achievement.type);
              return (
                <div
                  key={achievement.type}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    earned
                      ? "border-gold/30 bg-gold/10 text-gold"
                      : "border-sand bg-sand/50 text-dark-green/30"
                  }`}
                >
                  {achievement.label}
                </div>
              );
            })}
            {/* Render any earned achievements not in KNOWN_ACHIEVEMENTS */}
            {achievements
              .filter(
                (a) => !KNOWN_ACHIEVEMENTS.some((ka) => ka.type === a.type)
              )
              .map((a) => (
                <div
                  key={a._id}
                  className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold"
                >
                  {a.type}
                </div>
              ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-sand px-6 py-4">
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Recent Results
            </h2>
          </div>
          {recentScores.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-dark-green/60">No events played yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-sand">
              {recentScores.map(({ score, event, course }) => {
                if (!event) return null;
                const isWinner = score.finishPosition === 1;
                return (
                  <div
                    key={score._id}
                    className={`flex items-center gap-4 px-6 py-4 ${
                      isWinner ? "border-l-4 border-l-gold" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/events/${event._id}`}
                        className="font-medium text-dark-green hover:text-augusta"
                      >
                        {event.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-dark-green/50">
                        {course?.name ?? "Unknown Course"} &middot;{" "}
                        {new Date(
                          event.date + "T12:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-dark-green">
                          {score.gross}
                        </p>
                        <p className="text-xs text-dark-green/50">Gross</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-dark-green">
                          {score.net}
                        </p>
                        <p className="text-xs text-dark-green/50">Net</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-dark-green">
                          {score.finishPosition === 0
                            ? "\u2014"
                            : ordinal(score.finishPosition)}
                        </p>
                        <p className="text-xs text-dark-green/50">Pos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-dark-green">
                          {score.pointsEarned > 0
                            ? score.pointsEarned
                            : "\u2014"}
                        </p>
                        <p className="text-xs text-dark-green/50">Pts</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
