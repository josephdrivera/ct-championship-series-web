"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface Props {
  user: Doc<"users">;
  onClose: () => void;
  activeEventId?: Id<"events">;
}

const STEP_COUNT = 4;

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current
              ? "w-6 bg-gold"
              : i < current
                ? "w-1.5 bg-gold/50"
                : "w-1.5 bg-sand"
          }`}
        />
      ))}
    </div>
  );
}

function PlayerAvatar({
  name,
  photo,
}: {
  name: string;
  photo?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        width={44}
        height={44}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream">
      {initials}
    </div>
  );
}

export default function WelcomeModal({ user, onClose, activeEventId }: Props) {
  const [step, setStep] = useState(0);
  const markWelcomeSeen = useMutation(api.users.markWelcomeSeen);

  const handleFinish = async () => {
    await markWelcomeSeen({});
    onClose();
  };

  const next = () => setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(0);

  const goNext = () => {
    setDirection(1);
    next();
  };
  const goBack = () => {
    setDirection(-1);
    back();
  };

  const eventsHref = activeEventId ? `/events/${activeEventId}` : "/events";

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
        <svg className="h-7 w-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-bold text-dark-green">
        Welcome to the Tournament
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-dark-green/60">
        Welcome to the CT Championship Series, {user.name.split(" ")[0]}!
        Compete in events, climb the leaderboard, and chase the championship.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-sand bg-white px-5 py-3 shadow-sm">
        <PlayerAvatar name={user.name} photo={user.photo} />
        <div className="text-left">
          <p className="font-semibold text-dark-green">{user.name}</p>
          {user.handicap !== undefined && (
            <p className="text-xs text-dark-green/50">
              Handicap: {user.handicap}
            </p>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs text-dark-green/40">
        Let&apos;s walk through a few things to get you set up.
      </p>
    </div>,

    // Step 1: Profile Photo
    <div key="photo" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-augusta/10">
        <svg className="h-7 w-7 text-augusta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-bold text-dark-green">
        Your Profile Photo
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-dark-green/60">
        Your avatar is pulled from your account. To update it, click your
        profile icon in the top-right corner and choose{" "}
        <span className="font-semibold text-dark-green">Manage account</span>.
        From there you can upload a new photo.
      </p>
      <div className="mt-6 flex justify-center">
        <div className="relative">
          <PlayerAvatar name={user.name} photo={user.photo} />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-dark-green shadow">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
          </div>
        </div>
      </div>
    </div>,

    // Step 2: Handicap
    <div key="handicap" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fairway/10">
        <svg className="h-7 w-7 text-fairway" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-bold text-dark-green">
        Set Your Handicap
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-dark-green/60">
        Your league handicap appears on your player profile and is used to
        calculate net scores during events. You can update it any time from
        your{" "}
        <span className="font-semibold text-dark-green">player profile</span>{" "}
        page.
      </p>
      {user.handicap !== undefined ? (
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-sand bg-white px-4 py-2 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-dark-green/50">
            Current
          </span>
          <span className="text-lg font-bold text-dark-green">
            {user.handicap}
          </span>
        </div>
      ) : (
        <p className="mt-5 text-xs font-medium text-gold">
          No handicap set yet — you can add one from your profile.
        </p>
      )}
    </div>,

    // Step 3: Scores
    <div key="scores" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-azalea/10">
        <svg className="h-7 w-7 text-azalea" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-bold text-dark-green">
        Entering Your Scores
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-dark-green/60">
        When an event is <span className="font-semibold text-dark-green">live</span>,
        go to the event page and scroll down to the scorecard. You can submit
        or update your round — gross, net, birdies, and more.
      </p>
      <Link
        href={eventsHref}
        onClick={handleFinish}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-augusta transition-colors hover:text-deep-green"
      >
        View Events
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>,
  ];

  const isLast = step === STEP_COUNT - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <div className="absolute inset-0 bg-midnight/60" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-2xl"
        >
          {/* Header */}
          <div className="bg-dark-green px-6 py-6 text-center">
            <p className="font-serif text-3xl font-bold text-gold">CT</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-cream/60">
              Championship Series
            </p>
          </div>

          {/* Step content */}
          <div className="px-6 pb-2 pt-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: dots + nav */}
          <div className="px-6 pb-6 pt-4">
            <StepDots current={step} total={STEP_COUNT} />

            <div className="mt-4 flex gap-3">
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="flex-1 rounded-full border border-sand px-6 py-3 text-sm font-semibold text-dark-green transition-colors hover:bg-sand/30"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? handleFinish : goNext}
                className="flex-1 rounded-full bg-gold px-6 py-3 text-sm font-bold text-dark-green transition-colors hover:bg-gold-dark"
              >
                {isLast ? "Get Started" : "Next"}
              </button>
            </div>

            {step === 0 && (
              <button
                onClick={handleFinish}
                className="mt-2 w-full py-2 text-xs text-dark-green/40 transition-colors hover:text-dark-green/60"
              >
                Skip walkthrough
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
