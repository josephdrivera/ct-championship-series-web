"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-dark-green/40 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function AccordionItem({
  id,
  title,
  children,
  openId,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  const isOpen = openId === id;
  return (
    <div className="border-b border-sand last:border-b-0">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left font-serif text-lg font-semibold text-dark-green transition-colors hover:text-augusta"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div className="pb-5 text-sm leading-relaxed text-dark-green/70">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-augusta text-xs font-bold text-cream">
        {n}
      </span>
      <p>{children}</p>
    </div>
  );
}

export default function HelpContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const isAdmin = currentUser?.isCommissioner || currentUser?.isSuperAdmin;
  const [openPlayer, setOpenPlayer] = useState<string | null>(null);
  const [openAdmin, setOpenAdmin] = useState<string | null>(null);

  const togglePlayer = (id: string) =>
    setOpenPlayer((prev) => (prev === id ? null : id));
  const toggleAdmin = (id: string) =>
    setOpenAdmin((prev) => (prev === id ? null : id));

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
            Help &amp; Guides
          </h1>
          <p className="mt-1 text-dark-green/60">
            Everything you need to know about the CT Championship Series.
          </p>
        </div>

        {/* ── Player Guides ─────────────────────────────────────── */}
        <section id="player" className="mb-10">
          <h2 className="mb-4 font-serif text-2xl font-bold text-dark-green">
            Player Guide
          </h2>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <AccordionItem
              id="handicap"
              title="How to Set Your Handicap"
              openId={openPlayer}
              onToggle={togglePlayer}
            >
              <Step n={1}>
                Go to the{" "}
                <Link href="/players" className="font-semibold text-augusta underline">
                  Players
                </Link>{" "}
                page and click your name to open your profile.
              </Step>
              <Step n={2}>
                Click the <strong>Edit</strong> pencil icon next to your handicap.
              </Step>
              <Step n={3}>
                Enter a value between <strong>0 and 54</strong> and press Save.
              </Step>
              <p className="mt-3 rounded-lg bg-gold/10 px-4 py-2 text-xs text-dark-green/60">
                Your handicap is used to calculate your net score during events. Keep it up to date before each tournament.
              </p>
            </AccordionItem>

            <AccordionItem
              id="scores"
              title="How to Submit Your Scores"
              openId={openPlayer}
              onToggle={togglePlayer}
            >
              <Step n={1}>
                Go to the{" "}
                <Link href="/events" className="font-semibold text-augusta underline">
                  Events
                </Link>{" "}
                page and find the event marked <strong>Live</strong>.
              </Step>
              <Step n={2}>
                Click on the event to open its detail page.
              </Step>
              <Step n={3}>
                Scroll down to the <strong>Submit Your Score</strong> form. Your handicap will be pre-filled.
              </Step>
              <Step n={4}>
                Enter your <strong>gross score</strong> — the net score will auto-calculate from your handicap.
              </Step>
              <Step n={5}>
                Fill in your stat breakdown: birdies, eagles, pars, bogeys, double-bogeys+, and pickups.
              </Step>
              <Step n={6}>
                Press <strong>Submit Score</strong>. You can update it until the commissioner finalizes results.
              </Step>
            </AccordionItem>

            <AccordionItem
              id="leaderboard"
              title="Understanding the Leaderboard"
              openId={openPlayer}
              onToggle={togglePlayer}
            >
              <p>
                Points are awarded based on your finish position in each event. The top finisher earns <strong>100 points</strong>, second gets <strong>85</strong>, and so on. If players tie, their points are averaged.
              </p>
              <p className="mt-2">
                <strong>Major events</strong> carry a <strong>2x multiplier</strong>, so finishing well in a major is worth twice the normal points.
              </p>
              <p className="mt-2">
                The season leaderboard on the{" "}
                <Link href="/leaderboard" className="font-semibold text-augusta underline">
                  Leaderboard
                </Link>{" "}
                page ranks all players by total points accumulated across the season.
              </p>
            </AccordionItem>

            <AccordionItem
              id="photo"
              title="Updating Your Profile Photo"
              openId={openPlayer}
              onToggle={togglePlayer}
            >
              <Step n={1}>
                Click your <strong>profile icon</strong> in the top-right corner of the header.
              </Step>
              <Step n={2}>
                Select <strong>Manage account</strong> from the dropdown.
              </Step>
              <Step n={3}>
                In the Clerk profile page, click your avatar and upload a new photo.
              </Step>
              <p className="mt-3 text-xs text-dark-green/50">
                Your photo syncs automatically — it will appear on your player card, profile, and leaderboard.
              </p>
            </AccordionItem>

            <AccordionItem
              id="checkin"
              title="How to Check In for an Event"
              openId={openPlayer}
              onToggle={togglePlayer}
            >
              <Step n={1}>
                When you receive a check-in reminder (email or notification), click the link or go to the event page.
              </Step>
              <Step n={2}>
                Click <strong>Check In</strong> to confirm you&#39;re playing.
              </Step>
              <p className="mt-3 text-xs text-dark-green/50">
                Checking in helps the commissioner plan pairings and tee times.
              </p>
            </AccordionItem>
          </div>
        </section>

        {/* ── Commissioner Guides ───────────────────────────────── */}
        {isAdmin && (
          <section id="commissioner" className="mb-10">
            <h2 className="mb-4 font-serif text-2xl font-bold text-dark-green">
              Commissioner Guide
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <AccordionItem
                id="create-event"
                title="How to Create an Event"
                openId={openAdmin}
                onToggle={toggleAdmin}
              >
                <Step n={1}>
                  Go to{" "}
                  <Link href="/admin/events" className="font-semibold text-augusta underline">
                    Admin &rarr; Events
                  </Link>.
                </Step>
                <Step n={2}>
                  Fill in the event name, select a course, date, and format (stroke play, match play, scramble, etc.).
                </Step>
                <Step n={3}>
                  Set the <strong>event number</strong> (1–8 for the season) and toggle <strong>Major</strong> if it&#39;s a championship event (2x points).
                </Step>
                <Step n={4}>
                  Optionally upload a course photo for the event card.
                </Step>
                <Step n={5}>
                  Click <strong>Create Event</strong>. The event starts as &quot;Upcoming&quot; — change its status to &quot;Active&quot; when play begins.
                </Step>
              </AccordionItem>

              <AccordionItem
                id="enter-scores"
                title="How to Enter &amp; Finalize Scores"
                openId={openAdmin}
                onToggle={toggleAdmin}
              >
                <Step n={1}>
                  Go to{" "}
                  <Link href="/admin/scores" className="font-semibold text-augusta underline">
                    Admin &rarr; Scores
                  </Link>.
                </Step>
                <Step n={2}>
                  Select the event from the dropdown.
                </Step>
                <Step n={3}>
                  For each player, enter their gross score, net score, and stat breakdown (birdies, eagles, pars, bogeys, double+, pickups).
                </Step>
                <Step n={4}>
                  Review the <strong>preview</strong> — it shows calculated finish positions and points for each player.
                </Step>
                <Step n={5}>
                  When everything looks correct, <strong>finalize</strong> the event. This locks scores, awards points, and updates the season standings.
                </Step>
                <p className="mt-3 rounded-lg bg-gold/10 px-4 py-2 text-xs text-dark-green/60">
                  Finalizing an event sends a notification to all players that results are official.
                </p>
              </AccordionItem>

              <AccordionItem
                id="manage-players"
                title="How to Manage Players"
                openId={openAdmin}
                onToggle={toggleAdmin}
              >
                <Step n={1}>
                  Go to{" "}
                  <Link href="/admin/players" className="font-semibold text-augusta underline">
                    Admin &rarr; Players
                  </Link>.
                </Step>
                <Step n={2}>
                  <strong>Invite a player:</strong> Enter their email in the invitation form. They&#39;ll receive a branded email with a sign-up link.
                </Step>
                <Step n={3}>
                  <strong>Edit a player:</strong> Click Edit to change their name or handicap.
                </Step>
                <Step n={4}>
                  <strong>Suspend a player:</strong> Click Suspend to disable their account. They won&#39;t be able to submit scores or participate. A &quot;Suspended&quot; badge will appear next to their name.
                </Step>
                <Step n={5}>
                  <strong>Hide a player:</strong> Click Hide to remove them from the public Players directory. They&#39;ll still appear in the admin panel.
                </Step>
              </AccordionItem>

              <AccordionItem
                id="create-season"
                title="How to Create a Season"
                openId={openAdmin}
                onToggle={toggleAdmin}
              >
                <Step n={1}>
                  Go to{" "}
                  <Link href="/admin/seasons" className="font-semibold text-augusta underline">
                    Admin &rarr; Seasons
                  </Link>.
                </Step>
                <Step n={2}>
                  Click <strong>Create Season</strong> and enter the year.
                </Step>
                <Step n={3}>
                  Set the status to <strong>Active</strong> when the season begins. Only one season can be active at a time.
                </Step>
                <Step n={4}>
                  At the end of the season, mark it as <strong>Completed</strong> and optionally assign the season champion.
                </Step>
              </AccordionItem>

              <AccordionItem
                id="announcements"
                title="How to Send Announcements"
                openId={openAdmin}
                onToggle={toggleAdmin}
              >
                <Step n={1}>
                  Go to{" "}
                  <Link href="/admin/notifications" className="font-semibold text-augusta underline">
                    Admin &rarr; Notifications
                  </Link>.
                </Step>
                <Step n={2}>
                  Enter a <strong>title</strong> and <strong>message body</strong>.
                </Step>
                <Step n={3}>
                  Click <strong>Send</strong>. The announcement will appear in every player&#39;s notification bell and trigger a push notification (for those who enabled it).
                </Step>
              </AccordionItem>
            </div>
          </section>
        )}

        {/* Footer link */}
        <div className="text-center text-sm text-dark-green/40">
          Still need help? Reach out to your league commissioner.
        </div>
      </div>
    </main>
  );
}
