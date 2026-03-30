"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const STATUS_OPTIONS = ["upcoming", "active", "completed"] as const;

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-sand text-dark-green/70",
  active: "bg-fairway/10 text-fairway",
  completed: "bg-dark-green/10 text-dark-green",
};

export default function AdminSeasonsPage() {
  const seasons = useQuery(api.seasons.getAllSeasons);
  const players = useQuery(api.players.getAllPlayers);
  const createSeason = useMutation(api.seasons.createSeason);
  const updateSeason = useMutation(api.seasons.updateSeason);

  // Create form state
  const [year, setYear] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ year?: string; name?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { year?: string; name?: string } = {};

    const yearNum = parseInt(year, 10);
    if (!year || isNaN(yearNum) || year.length !== 4) {
      newErrors.year = "Enter a valid 4-digit year";
    }
    if (!name.trim()) {
      newErrors.name = "Season name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await createSeason({ year: yearNum, name: name.trim() });
      toast.success("Season created");
      setYear("");
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create season");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    seasonId: Id<"seasons">,
    status: "upcoming" | "active" | "completed"
  ) {
    try {
      await updateSeason({ seasonId, status });
      toast.success(`Season marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update season");
    }
  }

  async function handleAssignChampion(
    seasonId: Id<"seasons">,
    championId: Id<"users">
  ) {
    try {
      await updateSeason({ seasonId, championId });
      toast.success("Champion assigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign champion");
    }
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Seasons
      </h1>
      <p className="mt-1 text-dark-green/60">
        Create and manage league seasons.
      </p>

      {/* Create Season Form */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          Create New Season
        </h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="season-year"
              className="block text-sm font-medium text-dark-green"
            >
              Year
            </label>
            <input
              id="season-year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2026"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-500">{errors.year}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="season-name"
              className="block text-sm font-medium text-dark-green"
            >
              Name
            </label>
            <input
              id="season-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2026 Season"
              className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Season"}
            </button>
          </div>
        </form>
      </div>

      {/* Seasons List */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          All Seasons
        </h2>

        {seasons === undefined ? (
          <div className="mt-4 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-36 animate-pulse rounded bg-augusta/10" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-augusta/10" />
                </div>
                <div className="mt-3 h-3.5 w-48 animate-pulse rounded bg-augusta/10" />
              </div>
            ))}
          </div>
        ) : seasons.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-dark-green/60">
              No seasons yet. Create your first season above.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {seasons.map((season) => {
              const champion = players?.find(
                (p) => p._id === season.championId
              );

              return (
                <div
                  key={season._id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-dark-green">
                          {season.name}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[season.status]}`}
                        >
                          {season.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-dark-green/60">
                        Year: {season.year}
                        {champion && (
                          <span className="ml-3 text-gold">
                            Champion: {champion.name}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status buttons */}
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            handleStatusChange(season._id, status)
                          }
                          disabled={season.status === status}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            season.status === status
                              ? "cursor-default bg-augusta text-cream"
                              : "bg-sand text-dark-green/70 hover:bg-dark-green/10"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Champion selector - only for completed seasons */}
                  {season.status === "completed" && players && (
                    <div className="mt-4 border-t border-sand pt-4">
                      <label className="block text-sm font-medium text-dark-green">
                        Assign Champion
                      </label>
                      <select
                        value={
                          season.championId
                            ? (season.championId as string)
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignChampion(
                              season._id,
                              e.target.value as Id<"users">
                            );
                          }
                        }}
                        className="mt-1 w-full max-w-xs rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
                      >
                        <option value="">Select champion...</option>
                        {players.map((player) => (
                          <option key={player._id} value={player._id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
