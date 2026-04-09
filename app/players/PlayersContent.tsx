"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type SortOption = "rank" | "name" | "handicap";

function PlayerAvatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover"
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
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream">
      {initials}
    </div>
  );
}

interface PlayersContentProps {
  preloadedPlayers: Preloaded<typeof api.players.getAllPlayers>;
  standings: Array<{
    standing: {
      userId: string;
      rank: number;
      totalPoints: number;
      wins: number;
      eventsPlayed: number;
    };
  }>;
}

export default function PlayersContent({
  preloadedPlayers,
  standings,
}: PlayersContentProps) {
  const players = usePreloadedQuery(preloadedPlayers);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("rank");

  const standingsMap = useMemo(() => {
    const map = new Map<
      string,
      { rank: number; totalPoints: number; wins: number; eventsPlayed: number }
    >();
    for (const { standing } of standings) {
      map.set(standing.userId, {
        rank: standing.rank,
        totalPoints: standing.totalPoints,
        wins: standing.wins,
        eventsPlayed: standing.eventsPlayed,
      });
    }
    return map;
  }, [standings]);

  const filteredAndSorted = useMemo(() => {
    let result = players.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    result = [...result].sort((a, b) => {
      if (sort === "rank") {
        const rankA = standingsMap.get(a._id)?.rank ?? Infinity;
        const rankB = standingsMap.get(b._id)?.rank ?? Infinity;
        return rankA - rankB;
      }
      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }
      // handicap
      const hcpA = a.handicap ?? Infinity;
      const hcpB = b.handicap ?? Infinity;
      return hcpA - hcpB;
    });

    return result;
  }, [players, search, sort, standingsMap]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "rank", label: "Rank" },
    { value: "name", label: "Name" },
    { value: "handicap", label: "Handicap" },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
            Players
          </h1>
          <p className="mt-1 text-dark-green/60">
            {players.length} member{players.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search + Sort Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-sand bg-white px-4 py-2 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta sm:max-w-xs"
          />
          <div className="flex gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-augusta text-cream"
                    : "bg-white text-dark-green hover:bg-augusta/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player Grid */}
        {filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg text-dark-green/60">
              {search
                ? "No players match your search."
                : "No players registered yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((player) => {
              const standing = standingsMap.get(player._id);
              return (
                <Link
                  key={player._id}
                  href={`/players/${player._id}`}
                  className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <PlayerAvatar name={player.name} photo={player.photo} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="truncate font-serif text-lg font-bold text-dark-green transition-colors group-hover:text-augusta">
                          {player.name}
                        </h2>
                        {player.isSuspended && (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Suspended
                          </span>
                        )}
                      </div>
                      {standing ? (
                        <span
                          className={`text-sm font-semibold ${
                            standing.rank <= 3
                              ? "text-gold"
                              : "text-dark-green/60"
                          }`}
                        >
                          #{standing.rank}
                        </span>
                      ) : (
                        <span className="text-sm text-dark-green/30">
                          {"\u2014"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-dark-green/60">
                      HCP{" "}
                      {player.handicap !== undefined
                        ? player.handicap
                        : "N/A"}
                    </p>
                    {standing && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-dark-green/50">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                          {standing.wins} win{standing.wins !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-augusta" />
                          {standing.eventsPlayed} event
                          {standing.eventsPlayed !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
