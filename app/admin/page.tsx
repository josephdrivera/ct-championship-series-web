"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { RoleManagementSection } from "@/components/admin/RoleManagementSection";

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
  { href: "/admin/players", label: "Players & roles" },
  { href: "/admin/notifications", label: "Send Announcement" },
  { href: "/help#commissioner", label: "Help & Guides" },
];

export default function AdminDashboard() {
  const activeSeason = useQuery(api.seasons.getActiveSeason);
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    activeSeason ? { seasonId: activeSeason._id } : "skip"
  );
  const allPlayers = useQuery(api.players.getAllPlayers);
  const toggleLiveMode = useMutation(api.seasons.toggleLiveMode);

  const liveOverride = activeSeason?.liveOverride;
  const isLiveOn = liveOverride === "on";
  const isLiveOff = liveOverride === "off";
  const isLiveAuto = !liveOverride;

  const handleLiveToggle = async (mode: "on" | "off" | undefined) => {
    if (!activeSeason) return;
    try {
      await toggleLiveMode({
        seasonId: activeSeason._id,
        liveOverride: mode,
      });
      const label = mode === "on" ? "ON" : mode === "off" ? "OFF" : "Auto";
      toast.success(`Live mode set to ${label}`);
    } catch {
      toast.error("Failed to toggle live mode");
    }
  };

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

      <RoleManagementSection />

      {/* Live Mode Toggle */}
      {activeSeason && (
        <div className="mt-10">
          <h2 className="font-serif text-xl font-bold text-dark-green">
            Live Mode
          </h2>
          <p className="mt-1 text-sm text-dark-green/60">
            Control whether the home page shows the live leaderboard.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-sand/50 p-1">
            <button
              onClick={() => handleLiveToggle("on")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isLiveOn
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-dark-green/60 hover:text-dark-green"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isLiveOn && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                )}
                On
              </span>
            </button>
            <button
              onClick={() => handleLiveToggle(undefined)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isLiveAuto
                  ? "bg-white text-dark-green shadow-sm"
                  : "text-dark-green/60 hover:text-dark-green"
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => handleLiveToggle("off")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isLiveOff
                  ? "bg-white text-dark-green shadow-sm"
                  : "text-dark-green/60 hover:text-dark-green"
              }`}
            >
              Off
            </button>
          </div>
          <p className="mt-2 text-xs text-dark-green/40">
            {isLiveAuto
              ? "Auto: Live mode activates when an event is in progress."
              : isLiveOn
                ? "Force ON: Home page shows live leaderboard now."
                : "Force OFF: Live leaderboard is hidden even during events."}
          </p>
        </div>
      )}
    </>
  );
}
