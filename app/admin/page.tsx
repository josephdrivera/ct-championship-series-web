"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-dark-green/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-dark-green">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-dark-green/60">{subtitle}</p>
      )}
    </div>
  );
}

const quickActions = [
  { href: "/admin/events", label: "Create Event" },
  { href: "/admin/scores", label: "Enter Scores" },
  { href: "/admin/courses", label: "Add Course" },
];

export default function AdminDashboard() {
  const activeSeason = useQuery(api.seasons.getActiveSeason);
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    activeSeason ? { seasonId: activeSeason._id } : "skip"
  );
  const allPlayers = useQuery(api.players.getAllPlayers);

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Dashboard
      </h1>
      <p className="mt-1 text-dark-green/60">
        Manage your league from here.
      </p>

      {/* Summary Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Season"
          value={activeSeason ? activeSeason.name : "None"}
          subtitle={
            activeSeason
              ? `${activeSeason.year} season`
              : "No active season"
          }
        />
        <StatCard
          label="Upcoming Events"
          value={upcomingEvents?.length ?? "—"}
          subtitle={
            activeSeason
              ? "Scheduled or in progress"
              : "Start a season first"
          }
        />
        <StatCard
          label="Total Players"
          value={allPlayers?.length ?? "—"}
          subtitle="Registered members"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-bold text-dark-green">
          Quick Actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
