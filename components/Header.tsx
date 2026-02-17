"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function AdminLink() {
  const currentUser = useQuery(api.users.getCurrentUser);
  if (!currentUser?.isCommissioner && !currentUser?.isSuperAdmin) return null;
  return (
    <Link
      href="/admin"
      className="text-sm font-semibold text-gold transition-colors hover:text-gold/80"
    >
      Admin
    </Link>
  );
}

const navLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Events" },
  { href: "/players", label: "Players" },
  { href: "/history", label: "History" },
];

export default function Header() {
  return (
    <header className="bg-dark-green">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-3xl font-bold tracking-tight text-gold">
            CT
          </span>
          <span className="hidden text-sm font-medium tracking-widest text-cream/80 uppercase sm:inline">
            Championship Series
          </span>
        </Link>

        <ul className="flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium tracking-wide text-cream/70 transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
            <li>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-dark-green transition-colors hover:bg-gold-dark"
                >
                  Sign In
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-4">
                  <AdminLink />
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 ring-2 ring-gold/50",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
