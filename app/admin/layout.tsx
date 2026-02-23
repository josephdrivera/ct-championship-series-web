"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/events", label: "Events", icon: "🏌️" },
  { href: "/admin/courses", label: "Courses", icon: "⛳" },
  { href: "/admin/scores", label: "Scores", icon: "📝" },
  { href: "/admin/players", label: "Players", icon: "👥" },
  { href: "/admin/seasons", label: "Seasons", icon: "🏆" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
];

function SidebarNav({
  onLinkClick,
}: {
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <div className="flex h-full flex-col">
      {/* Commissioner Info */}
      <div className="border-b border-cream/10 px-4 py-5">
        <div className="flex items-center gap-3">
          {currentUser?.photo ? (
            <Image
              src={currentUser.photo}
              alt={currentUser.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-gold/50"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream ring-2 ring-gold/50">
              {currentUser?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-cream">
              {currentUser?.name ?? "Loading..."}
            </p>
            <p className="text-xs text-gold">
              {currentUser?.isSuperAdmin ? "Super Admin" : "Commissioner"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-augusta text-cream"
                      : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to site */}
      <div className="border-t border-cream/10 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-cream/50 transition-colors hover:text-cream/70"
        >
          &larr; Back to site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading state
  if (currentUser === undefined) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-augusta border-t-transparent" />
          <p className="mt-4 text-sm text-dark-green/60">Loading...</p>
        </div>
      </main>
    );
  }

  // Not authorized
  if (
    currentUser === null ||
    (!currentUser.isCommissioner && !currentUser.isSuperAdmin)
  ) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-bold text-dark-green">
            Not Authorized
          </h1>
          <p className="mt-3 text-dark-green/60">
            You must be a commissioner to access the admin area.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-augusta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Mobile top bar */}
      <div className="fixed top-16 right-0 left-0 z-30 flex items-center border-b border-sand bg-cream px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-dark-green hover:bg-sand"
          aria-label="Open sidebar"
        >
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
        </button>
        <span className="ml-3 font-serif text-lg font-bold text-dark-green">
          Admin
        </span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-midnight/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-64 bg-dark-green shadow-xl">
            <SidebarNav onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-dark-green lg:block">
        <SidebarNav />
      </aside>

      {/* Content area */}
      <div className="flex-1 bg-cream pt-14 lg:pt-0">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
