"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Doc } from "@/convex/_generated/dataModel";
import CountdownTimer, { getTimeLeft } from "@/components/CountdownTimer";

const FORMAT_LABELS: Record<string, string> = {
  stroke: "Stroke Play",
  match: "Match Play",
  bestBall: "Best Ball",
  scramble: "Scramble",
  stableford: "Stableford",
  skins: "Skins",
};

export default function EventCountdownModal({
  userName,
  event,
  course,
  courseImageUrl,
}: {
  userName: string;
  event: Doc<"events">;
  course: Doc<"courses"> | null;
  courseImageUrl?: string | null;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if within 3 days
    const timeLeft = getTimeLeft(event.date);
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (timeLeft.total <= 0 || timeLeft.total > threeDaysMs) return;

    // Check sessionStorage to show once per session per event
    const key = `ct-event-hype-${event._id}`;
    if (sessionStorage.getItem(key)) return;

    // Small delay before showing for smoother UX
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [event._id, event.date]);

  const handleDismiss = () => {
    sessionStorage.setItem(`ct-event-hype-${event._id}`, "1");
    setIsVisible(false);
  };

  const firstName = userName.split(" ")[0];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-midnight/60" onClick={handleDismiss} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-2xl"
          >
            {/* Course image or gradient header */}
            <div className="relative h-36 overflow-hidden">
              {courseImageUrl ? (
                <>
                  <Image
                    src={courseImageUrl}
                    alt={course?.name ?? "Course"}
                    fill
                    className="object-cover"
                    sizes="448px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-dark-green/60 to-dark-green/90" />
                </>
              ) : (
                <div className="h-full bg-gradient-to-br from-dark-green to-augusta" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-cream/70">
                  Welcome back,
                </p>
                <p className="font-serif text-2xl font-bold text-gold">
                  {firstName}!
                </p>
              </div>
            </div>

            {/* Event details */}
            <div className="px-6 py-5">
              <div className="text-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-dark-green">
                    {event.name}
                  </h3>
                  {event.isMajor && (
                    <span className="rounded-full bg-azalea/10 px-2.5 py-0.5 text-xs font-semibold text-azalea">
                      MAJOR
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-dark-green/60">
                  {course?.name ?? "TBD"} &middot;{" "}
                  {FORMAT_LABELS[event.format] ?? event.format}
                </p>
                <p className="mt-1 text-sm font-medium text-dark-green/80">
                  {new Date(event.date + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>

              {/* Countdown */}
              <div className="mt-5 rounded-xl border border-sand bg-white px-4 py-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-dark-green/40">
                  Tee Time Countdown
                </p>
                <CountdownTimer targetDate={event.date} size="large" />
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-full border border-sand px-4 py-3 text-sm font-medium text-dark-green/60 transition-colors hover:bg-sand/30 hover:text-dark-green"
                >
                  Dismiss
                </button>
                <Link
                  href={`/events/${event._id}`}
                  onClick={handleDismiss}
                  className="flex-1 rounded-full bg-gold px-4 py-3 text-center text-sm font-bold text-dark-green transition-colors hover:bg-gold-dark"
                >
                  View Event Details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
