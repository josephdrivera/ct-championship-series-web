"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-gold ${
                  pathname.startsWith(link.href)
                    ? "text-gold"
                    : "text-cream/70"
                }`}
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

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-cream/70 transition-colors hover:text-gold md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-cream/10 md:hidden">
          <ul className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? "bg-augusta text-cream"
                      : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
              <li className="pt-3 border-t border-cream/10">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-full bg-gold px-4 py-2.5 text-center text-sm font-semibold text-dark-green transition-colors hover:bg-gold-dark"
                  >
                    Sign In
                  </Link>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-4 px-3">
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
        </div>
      )}
    </header>
  );
}
