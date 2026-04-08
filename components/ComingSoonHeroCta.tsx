"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const outlineBtn =
  "inline-block rounded-full border border-cream/30 px-8 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream hover:bg-cream/10";

const goldBtn =
  "inline-block rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-dark-green transition-colors hover:bg-gold-dark";

/**
 * Home hero when there is no active season: Clerk-aware CTAs (server page always showed Sign In).
 */
export default function ComingSoonHeroCta() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      <SignedOut>
        <Link href="/sign-in" className={outlineBtn}>
          Sign In
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/leaderboard" className={goldBtn}>
          View leaderboard
        </Link>
      </SignedIn>
    </div>
  );
}
