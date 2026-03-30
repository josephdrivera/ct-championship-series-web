"use client";

import Image from "next/image";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

export default function WelcomeModal({
  user,
  onClose,
}: {
  user: Doc<"users">;
  onClose: () => void;
}) {
  const markWelcomeSeen = useMutation(api.users.markWelcomeSeen);

  const handleGetStarted = async () => {
    await markWelcomeSeen({});
    onClose();
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-midnight/60" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-2xl"
        >
          {/* Header accent */}
          <div className="bg-dark-green px-6 py-8 text-center">
            <p className="font-serif text-4xl font-bold text-gold">CT</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-cream/60">
              Championship Series
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 text-center">
            <h2 className="font-serif text-2xl font-bold text-dark-green">
              Welcome to the League
            </h2>
            <p className="mt-2 text-sm text-dark-green/60">
              Your private tour experience awaits. Compete in events, climb the
              leaderboard, and chase the championship.
            </p>

            {/* Player card */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-sand bg-white px-5 py-3 shadow-sm">
              {user.photo ? (
                <Image
                  src={user.photo}
                  alt={user.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream">
                  {initials}
                </div>
              )}
              <div className="text-left">
                <p className="font-semibold text-dark-green">{user.name}</p>
                {user.handicap !== undefined && (
                  <p className="text-xs text-dark-green/50">
                    Handicap: {user.handicap}
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleGetStarted}
              className="mt-6 w-full rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-dark-green transition-colors hover:bg-gold-dark"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
