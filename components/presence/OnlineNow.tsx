"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Consider a user offline if we have not seen a heartbeat in this window. */
const STALE_MS = 3 * 60 * 1000;
const MAX_AVATARS = 6;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OnlineNow() {
  const presence = useQuery(api.presence.listPresence);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const online = useMemo(() => {
    if (!presence) return [];
    return presence.filter((p) => now - p.lastSeenAt < STALE_MS);
  }, [presence, now]);

  if (!presence || online.length === 0) return null;

  const shown = online.slice(0, MAX_AVATARS);
  const extra = online.length - shown.length;

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-cream/15 bg-midnight/80 px-2 py-1"
      title={`${online.length} member${online.length === 1 ? "" : "s"} online`}
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-fairway" />
      <div className="flex -space-x-2">
        {shown.map(({ user }) => (
          <div
            key={user._id}
            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-dark-green"
          >
            {user.photo ? (
              <Image
                src={user.photo}
                alt={user.name}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-augusta text-[10px] font-semibold text-cream">
                {initials(user.name)}
              </div>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream/10 text-[10px] font-semibold text-cream ring-2 ring-dark-green">
            +{extra}
          </div>
        )}
      </div>
      <span className="hidden pr-1 text-xs font-medium text-cream/80 sm:inline">
        {online.length} online
      </span>
    </div>
  );
}
