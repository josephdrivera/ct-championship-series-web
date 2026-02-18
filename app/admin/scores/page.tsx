"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

// Mirror of backend points table from convex/helpers.ts
const POINTS_TABLE = [100, 85, 72, 62, 54, 48, 43, 39, 36, 33, 30];
const DNF_POINTS = 15;

type PlayerScoreRow = {
  userId: Id<"users">;
  name: string;
  handicap: number;
  gross: string;
  net: string;
  birdies: string;
  eagles: string;
  pars: string;
  bogeys: string;
  doublePlus: string;
  pickups: string;
};

type PreviewResult = {
  userId: Id<"users">;
  name: string;
  net: number;
  gross: number;
  finishPosition: number;
  pointsEarned: number;
};

function calculatePreview(
  scores: Map<string, PlayerScoreRow>,
  multiplier: number
): PreviewResult[] {
  const entries = [...scores.values()]
    .filter((s) => s.gross !== "" && !isNaN(parseInt(s.gross, 10)))
    .map((s) => ({
      userId: s.userId,
      name: s.name,
      gross: parseInt(s.gross, 10),
      net: parseInt(s.net, 10) || parseInt(s.gross, 10) - s.handicap,
      finishPosition: 0,
      pointsEarned: 0,
    }));

  entries.sort((a, b) => a.net - b.net);

  let position = 0;
  let i = 0;
  while (i < entries.length) {
    const tiedGroup: (typeof entries)[number][] = [];
    const currentNet = entries[i].net;
    while (i < entries.length && entries[i].net === currentNet) {
      tiedGroup.push(entries[i]);
      i++;
    }
    let totalPoints = 0;
    for (let p = position; p < position + tiedGroup.length; p++) {
      totalPoints += p < POINTS_TABLE.length ? POINTS_TABLE[p] : DNF_POINTS;
    }
    const avgPoints = (totalPoints / tiedGroup.length) * multiplier;
    for (const entry of tiedGroup) {
      entry.finishPosition = position + 1;
      entry.pointsEarned = Math.round(avgPoints * 100) / 100;
    }
    position += tiedGroup.length;
  }

  return entries;
}

const SCORE_FIELDS = [
  { key: "birdies" as const, label: "Birdies" },
  { key: "eagles" as const, label: "Eagles" },
  { key: "pars" as const, label: "Pars" },
  { key: "bogeys" as const, label: "Bogeys" },
  { key: "doublePlus" as const, label: "Double+" },
  { key: "pickups" as const, label: "Pickups" },
];

export default function AdminScoresPage() {
  const activeSeason = useQuery(api.seasons.getActiveSeason);
  const seasonEvents = useQuery(
    api.events.getSeasonEvents,
    activeSeason ? { seasonId: activeSeason._id } : "skip"
  );
  const allPlayers = useQuery(api.players.getAllPlayers);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [scoreData, setScoreData] = useState<Map<string, PlayerScoreRow>>(
    new Map()
  );
  const [previewResults, setPreviewResults] = useState<
    PreviewResult[] | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const eventScores = useQuery(
    api.scores.getEventScores,
    selectedEventId
      ? { eventId: selectedEventId as Id<"events"> }
      : "skip"
  );

  const adminSubmitScore = useMutation(api.scores.adminSubmitScore);
  const calculateEventPoints = useMutation(api.scores.calculateEventPoints);

  // Filter events to active or completed only
  const eligibleEvents = (seasonEvents ?? []).filter(
    (e) => e.event.status === "active" || e.event.status === "completed"
  );

  const selectedEntry = seasonEvents?.find(
    (e) => (e.event._id as string) === selectedEventId
  );
  const selectedEvent = selectedEntry?.event;

  const hasExistingScores =
    eventScores !== undefined && eventScores.length > 0;

  // Initialize score data when event or players change
  useEffect(() => {
    if (!selectedEventId || !allPlayers) return;

    const newMap = new Map<string, PlayerScoreRow>();
    for (const player of allPlayers) {
      const existingScore = eventScores?.find(
        (es) => es.user?._id === player._id
      )?.score;

      newMap.set(player._id as string, {
        userId: player._id,
        name: player.name,
        handicap: existingScore?.handicap ?? player.handicap ?? 0,
        gross: existingScore ? String(existingScore.gross) : "",
        net: existingScore ? String(existingScore.net) : "",
        birdies: existingScore ? String(existingScore.birdies) : "",
        eagles: existingScore ? String(existingScore.eagles) : "",
        pars: existingScore ? String(existingScore.pars) : "",
        bogeys: existingScore ? String(existingScore.bogeys) : "",
        doublePlus: existingScore ? String(existingScore.doublePlus) : "",
        pickups: existingScore ? String(existingScore.pickups) : "",
      });
    }
    setScoreData(newMap);
    setPreviewResults(null);
    setSubmitted(false);
  }, [selectedEventId, allPlayers, eventScores]);

  function updatePlayerScore(
    userId: string,
    field: keyof PlayerScoreRow,
    value: string
  ) {
    setScoreData((prev) => {
      const copy = new Map(prev);
      const row = { ...copy.get(userId)! };

      if (field === "handicap") {
        const h = parseInt(value, 10) || 0;
        row.handicap = h;
        const g = parseInt(row.gross, 10);
        if (!isNaN(g)) {
          row.net = String(g - h);
        }
      } else if (field === "gross") {
        row.gross = value;
        const g = parseInt(value, 10);
        if (!isNaN(g)) {
          row.net = String(g - row.handicap);
        } else {
          row.net = "";
        }
      } else {
        (row as Record<string, unknown>)[field] = value;
      }

      copy.set(userId, row);
      return copy;
    });
    setPreviewResults(null);
  }

  function handlePreview() {
    if (!selectedEvent) return;
    const multiplier = selectedEvent.multiplier ?? 1;
    const results = calculatePreview(scoreData, multiplier);
    if (results.length === 0) {
      toast.error("No scores entered to preview");
      return;
    }
    setPreviewResults(results);
  }

  async function handleSubmitAll() {
    if (!selectedEventId) return;
    const eventId = selectedEventId as Id<"events">;

    const playersWithScores = [...scoreData.values()].filter(
      (s) => s.gross !== "" && !isNaN(parseInt(s.gross, 10))
    );

    if (playersWithScores.length === 0) {
      toast.error("No scores entered");
      return;
    }

    setSubmitting(true);
    try {
      for (const player of playersWithScores) {
        await adminSubmitScore({
          eventId,
          userId: player.userId,
          gross: parseInt(player.gross, 10),
          net: parseInt(player.net, 10),
          handicap: player.handicap,
          birdies: parseInt(player.birdies, 10) || 0,
          eagles: parseInt(player.eagles, 10) || 0,
          pars: parseInt(player.pars, 10) || 0,
          bogeys: parseInt(player.bogeys, 10) || 0,
          doublePlus: parseInt(player.doublePlus, 10) || 0,
          pickups: parseInt(player.pickups, 10) || 0,
        });
      }

      await calculateEventPoints({ eventId });

      toast.success(
        `Scores submitted for ${playersWithScores.length} players. Points calculated.`
      );
      setSubmitted(true);
      setPreviewResults(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit scores"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecalculate() {
    if (!selectedEventId) return;
    try {
      await calculateEventPoints({
        eventId: selectedEventId as Id<"events">,
      });
      toast.success("Points recalculated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Recalculation failed"
      );
    }
  }

  const inputClass =
    "w-16 rounded-lg border border-sand bg-white px-2 py-1.5 text-center text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta";

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Score Entry &amp; Points
      </h1>
      <p className="mt-1 text-dark-green/60">
        Enter scores for an event, preview calculated points, and submit.
      </p>

      {/* Event Selector */}
      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          Select Event
        </h2>
        <div className="mt-4">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
          >
            <option value="">Choose an event...</option>
            {eligibleEvents.map((entry) => (
              <option key={entry.event._id} value={entry.event._id}>
                #{entry.event.eventNumber} — {entry.event.name} ({entry.course?.name},{" "}
                {entry.event.date}){entry.event.isMajor ? " ★ MAJOR" : ""} [
                {entry.event.status}]
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && hasExistingScores && (
          <div className="mt-3 rounded-lg bg-gold/10 px-4 py-2.5 text-sm text-gold-dark">
            This event already has scores entered. Editing and resubmitting
            will update existing records.
          </div>
        )}

        {selectedEvent && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-dark-green/60">
            <span>
              Format:{" "}
              <span className="font-medium text-dark-green">
                {selectedEvent.format}
              </span>
            </span>
            {selectedEvent.isMajor && (
              <span className="rounded-full bg-azalea/10 px-2.5 py-0.5 text-xs font-semibold text-azalea">
                MAJOR (2x Points)
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                selectedEvent.status === "active"
                  ? "bg-fairway/10 text-fairway"
                  : "bg-dark-green/10 text-dark-green"
              }`}
            >
              {selectedEvent.status}
            </span>
          </div>
        )}
      </div>

      {/* Score Entry Table */}
      {selectedEventId && allPlayers && scoreData.size > 0 && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-dark-green">
            Enter Scores
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left">
                  <th className="px-2 py-2 font-semibold text-dark-green">
                    Player
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-dark-green">
                    HCP
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-dark-green">
                    Gross
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-dark-green">
                    Net
                  </th>
                  {SCORE_FIELDS.map((f) => (
                    <th
                      key={f.key}
                      className="px-2 py-2 text-center font-semibold text-dark-green"
                    >
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...scoreData.entries()].map(([id, row], idx) => (
                  <tr
                    key={id}
                    className={`border-b border-sand/50 ${
                      idx % 2 === 0 ? "bg-cream/50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 font-medium text-dark-green">
                      {row.name}
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        value={row.handicap}
                        onChange={(e) =>
                          updatePlayerScore(id, "handicap", e.target.value)
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        value={row.gross}
                        onChange={(e) =>
                          updatePlayerScore(id, "gross", e.target.value)
                        }
                        placeholder="—"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        value={row.net}
                        readOnly
                        tabIndex={-1}
                        className={`${inputClass} bg-cream/80 text-dark-green/60`}
                      />
                    </td>
                    {SCORE_FIELDS.map((f) => (
                      <td key={f.key} className="px-1 py-1.5">
                        <input
                          type="number"
                          value={row[f.key]}
                          onChange={(e) =>
                            updatePlayerScore(id, f.key, e.target.value)
                          }
                          placeholder="0"
                          className={inputClass}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handlePreview}
              className="rounded-full bg-sand px-5 py-2.5 text-sm font-semibold text-dark-green transition-colors hover:bg-sand/80"
            >
              Preview Points
            </button>
            <button
              onClick={handleSubmitAll}
              disabled={submitting}
              className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit All Scores"}
            </button>
            {hasExistingScores && (
              <button
                onClick={handleRecalculate}
                className="rounded-full bg-dark-green/10 px-5 py-2.5 text-sm font-semibold text-dark-green transition-colors hover:bg-dark-green/20"
              >
                Recalculate Points
              </button>
            )}
          </div>
        </div>
      )}

      {/* Points Preview */}
      {previewResults && previewResults.length > 0 && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-dark-green">
            Points Preview
          </h2>
          {selectedEvent?.isMajor && (
            <p className="mt-1 text-sm text-azalea">
              Major event — all points doubled (2x multiplier)
            </p>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left">
                  <th className="px-3 py-2 font-semibold text-dark-green">
                    Pos
                  </th>
                  <th className="px-3 py-2 font-semibold text-dark-green">
                    Player
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Gross
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Net
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewResults.map((r, idx) => (
                  <tr
                    key={r.userId}
                    className={`border-b border-sand/50 ${
                      idx === 0
                        ? "bg-gold/10"
                        : idx % 2 === 0
                          ? "bg-cream/50"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-semibold text-dark-green">
                      {r.finishPosition}
                    </td>
                    <td className="px-3 py-2 font-medium text-dark-green">
                      {r.name}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-green/70">
                      {r.gross}
                    </td>
                    <td className="px-3 py-2 text-center font-medium text-dark-green">
                      {r.net}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-augusta">
                      {r.pointsEarned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Leaderboard (after submission) */}
      {submitted && eventScores && eventScores.length > 0 && (
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-dark-green">
            Event Leaderboard
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left">
                  <th className="px-3 py-2 font-semibold text-dark-green">
                    Pos
                  </th>
                  <th className="px-3 py-2 font-semibold text-dark-green">
                    Player
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Gross
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Net
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-dark-green">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {eventScores.map((entry, idx) => (
                  <tr
                    key={entry.score._id}
                    className={`border-b border-sand/50 ${
                      idx === 0
                        ? "bg-gold/10"
                        : idx % 2 === 0
                          ? "bg-cream/50"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-semibold text-dark-green">
                      {entry.score.finishPosition}
                    </td>
                    <td className="px-3 py-2 font-medium text-dark-green">
                      {entry.user?.name ?? "Unknown"}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-green/70">
                      {entry.score.gross}
                    </td>
                    <td className="px-3 py-2 text-center font-medium text-dark-green">
                      {entry.score.net}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-augusta">
                      {entry.score.pointsEarned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading / empty states */}
      {activeSeason === undefined && (
        <p className="mt-8 text-sm text-dark-green/60">Loading...</p>
      )}
      {activeSeason === null && (
        <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-dark-green/60">
            No active season found. Create a season first.
          </p>
        </div>
      )}
      {activeSeason && eligibleEvents.length === 0 && seasonEvents !== undefined && (
        <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-dark-green/60">
            No active or completed events in this season yet.
          </p>
        </div>
      )}
    </>
  );
}
