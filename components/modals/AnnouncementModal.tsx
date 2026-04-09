"use client";

import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  notificationId: Id<"notifications">;
  title: string;
  body: string;
  createdAt: number;
  onConfirmed: () => void;
}

export default function AnnouncementModal({
  notificationId,
  title,
  body,
  createdAt,
  onConfirmed,
}: Props) {
  const markAsRead = useMutation(api.notifications.markAsRead);

  async function handleConfirm() {
    await markAsRead({ notificationId });
    onConfirmed();
  }

  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      >
        {/* Solid backdrop — cannot dismiss by clicking outside */}
        <div className="absolute inset-0 bg-midnight/80" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-2xl"
        >
          {/* Header */}
          <div className="bg-dark-green px-6 py-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20">
              <svg
                className="h-6 w-6 text-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                />
              </svg>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-cream/60">
              League Announcement
            </p>
          </div>

          {/* Content */}
          <div className="px-6 pb-2 pt-6 text-center">
            <h2 className="font-serif text-2xl font-bold text-dark-green">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-dark-green/70 whitespace-pre-line">
              {body}
            </p>
            <p className="mt-4 text-xs text-dark-green/30">
              {formattedDate} at {formattedTime}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4">
            <button
              onClick={handleConfirm}
              className="w-full rounded-full bg-gold px-6 py-3 text-sm font-bold text-dark-green transition-colors hover:bg-gold-dark"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
