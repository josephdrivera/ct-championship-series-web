"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const HEARTBEAT_MS = 60_000;

/**
 * Keeps a presence row fresh while the user is signed in and the tab is open.
 */
export default function PresenceHeartbeat() {
  const { isLoaded, isSignedIn } = useAuth();
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return;
    if (!isLoaded || !isSignedIn) return;

    const run = () => {
      void heartbeat().catch(() => {
        /* ignore transient auth/network errors */
      });
    };

    run();
    const interval = setInterval(run, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoaded, isSignedIn, heartbeat]);

  return null;
}
