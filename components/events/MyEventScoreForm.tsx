"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";

type Props = {
  eventId: Id<"events">;
};

function parseInt0(s: string): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

export default function MyEventScoreForm({ eventId }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const myScore = useQuery(api.scores.getMyEventScore, { eventId });
  const submitScore = useMutation(api.scores.submitScore);
  const updateMyScore = useMutation(api.scores.updateMyScore);

  const [gross, setGross] = useState("");
  const [handicap, setHandicap] = useState("");
  const [net, setNet] = useState("");
  const [birdies, setBirdies] = useState("0");
  const [eagles, setEagles] = useState("0");
  const [pars, setPars] = useState("0");
  const [bogeys, setBogeys] = useState("0");
  const [doublePlus, setDoublePlus] = useState("0");
  const [pickups, setPickups] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (myScore) {
      setGross(String(myScore.gross));
      setHandicap(String(myScore.handicap));
      setNet(String(myScore.net));
      setBirdies(String(myScore.birdies));
      setEagles(String(myScore.eagles));
      setPars(String(myScore.pars));
      setBogeys(String(myScore.bogeys));
      setDoublePlus(String(myScore.doublePlus));
      setPickups(String(myScore.pickups));
    } else {
      setGross("");
      setHandicap(
        currentUser.handicap !== undefined
          ? String(currentUser.handicap)
          : "0"
      );
      setNet("");
      setBirdies("0");
      setEagles("0");
      setPars("0");
      setBogeys("0");
      setDoublePlus("0");
      setPickups("0");
    }
  }, [currentUser, myScore]);

  function syncNetFromGross(g: string, h: string) {
    const gv = parseInt(g, 10);
    const hv = parseInt(h, 10);
    if (!Number.isFinite(gv)) {
      setNet("");
      return;
    }
    const hh = Number.isFinite(hv) ? hv : 0;
    setNet(String(gv - hh));
  }

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }

  return (
    <>
      <SignedOut>
        <div className="mb-8 rounded-2xl border border-sand bg-white/80 p-6 shadow-sm">
          <p className="text-sm text-dark-green/80">
            <Link
              href="/sign-in"
              className="font-semibold text-fairway underline-offset-2 hover:underline"
            >
              Sign in
            </Link>{" "}
            to enter or update your score while this event is live.
          </p>
        </div>
      </SignedOut>

      <SignedIn>
        {currentUser === undefined || myScore === undefined ? (
          <div className="mb-8 h-24 animate-pulse rounded-2xl bg-white/50" />
        ) : currentUser === null || currentUser.isSuspended ? null : (
          <div className="mb-8 rounded-2xl border border-fairway/25 bg-gradient-to-br from-white to-fairway/5 p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl font-bold text-dark-green">
                Your score
              </h2>
              {myScore &&
                (myScore.pointsEarned > 0 || myScore.finishPosition > 0) && (
                  <span className="text-xs font-medium text-amber-800">
                    Placement or points were set — editing clears them until the
                    commissioner recalculates.
                  </span>
                )}
            </div>
            <p className="mb-4 text-sm text-dark-green/70">
              {myScore
                ? "Update your totals if something was entered wrong. You can edit while the event is active."
                : "Add your round totals while the event is active — for example if you are not using hole-by-hole live scoring."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-dark-green">
                Gross
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-dark-green"
                  value={gross}
                  onChange={(e) => {
                    setGross(e.target.value);
                    syncNetFromGross(e.target.value, handicap);
                  }}
                />
              </label>
              <label className="block text-sm font-medium text-dark-green">
                Course handicap (this round)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-dark-green"
                  value={handicap}
                  onChange={(e) => {
                    setHandicap(e.target.value);
                    syncNetFromGross(gross, e.target.value);
                  }}
                />
              </label>
              <label className="block text-sm font-medium text-dark-green">
                Net
                <input
                  type="number"
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-sand bg-cream/40 px-3 py-2 text-dark-green"
                  value={net}
                />
              </label>
              {(
                [
                  ["Birdies", birdies, setBirdies],
                  ["Eagles", eagles, setEagles],
                  ["Pars", pars, setPars],
                  ["Bogeys", bogeys, setBogeys],
                  ["Double+", doublePlus, setDoublePlus],
                  ["Pickups", pickups, setPickups],
                ] as const
              ).map(([label, val, setVal]) => (
                <label
                  key={label}
                  className="block text-sm font-medium text-dark-green"
                >
                  {label}
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-sand px-3 py-2 text-dark-green"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const g = parseInt(gross, 10);
                if (!Number.isFinite(g)) {
                  toast.error("Enter a gross score");
                  return;
                }
                const h = parseInt(handicap, 10);
                const hh = Number.isFinite(h) ? h : 0;
                const n = parseInt(net, 10);
                const netVal = Number.isFinite(n) ? n : g - hh;

                setBusy(true);
                try {
                  const payload = {
                    eventId,
                    gross: g,
                    net: netVal,
                    handicap: hh,
                    birdies: parseInt0(birdies),
                    eagles: parseInt0(eagles),
                    pars: parseInt0(pars),
                    bogeys: parseInt0(bogeys),
                    doublePlus: parseInt0(doublePlus),
                    pickups: parseInt0(pickups),
                  };
                  if (myScore) {
                    await updateMyScore(payload);
                    toast.success("Score updated");
                  } else {
                    await submitScore(payload);
                    toast.success("Score submitted");
                  }
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Could not save score"
                  );
                } finally {
                  setBusy(false);
                }
              }}
              className="mt-6 rounded-full bg-dark-green px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
            >
              {myScore ? "Save changes" : "Submit score"}
            </button>
          </div>
        )}
      </SignedIn>
    </>
  );
}
