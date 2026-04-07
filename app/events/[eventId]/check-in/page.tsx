"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState } from "react";

export default function EventCheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const eventData = useQuery(api.events.getEventById, {
    eventId: eventId as Id<"events">,
  });
  const myCheckIn = useQuery(
    api.checkIns.getMyCheckInForEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );
  const checkIn = useMutation(api.checkIns.checkInForEvent);
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    setLoading(true);
    try {
      const r = await checkIn({ eventId: eventId as Id<"events"> });
      if (r.status === "confirmed") {
        toast.success("You're checked in — see you there!");
      } else {
        toast.success("Your check-in is updated.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to check in");
    } finally {
      setLoading(false);
    }
  }

  if (eventData === undefined) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-cream px-4 py-12 text-center text-dark-green/60">
        Loading...
      </main>
    );
  }

  if (!eventData) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-cream px-4 py-12 text-center">
        <p className="text-dark-green">Event not found.</p>
        <Link
          href="/events"
          className="mt-4 inline-block text-augusta underline"
        >
          Back to events
        </Link>
      </main>
    );
  }

  const { event, course } = eventData;
  const dateStr = new Date(event.date + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-2xl font-bold text-dark-green">
          Check in
        </h1>
        <p className="mt-2 text-dark-green/80">{event.name}</p>
        <p className="mt-1 text-sm text-dark-green/60">
          {course?.name} · {dateStr}
        </p>

        <SignedOut>
          <p className="mt-8 text-dark-green">
            Sign in to let us know you&apos;re playing.
          </p>
          <SignInButton
            mode="modal"
            forceRedirectUrl={`/events/${eventId}/check-in`}
          >
            <button
              type="button"
              className="mt-4 rounded-full bg-augusta px-6 py-3 font-semibold text-cream transition-colors hover:bg-deep-green"
            >
              Sign in
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {event.status === "canceled" ? (
            <p className="mt-8 text-red-600">This event was canceled.</p>
          ) : (
            <>
              {myCheckIn ? (
                <p className="mt-8 text-dark-green">
                  You&apos;re checked in for this event. Thanks!
                </p>
              ) : (
                <>
                  <p className="mt-8 text-dark-green">
                    Are you planning to play? Tap below to confirm.
                  </p>
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="mt-4 rounded-full bg-augusta px-6 py-3 font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Yes, I’m playing"}
                  </button>
                </>
              )}
            </>
          )}
        </SignedIn>

        <p className="mt-10 text-sm">
          <Link
            href={`/events/${eventId}`}
            className="text-augusta underline transition-colors hover:text-deep-green"
          >
            View event details
          </Link>
        </p>
      </div>
    </main>
  );
}
