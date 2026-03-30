"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export default function PushPermissionPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const subscribe = useMutation(api.pushSubscriptions.subscribe);
  const hasSubscription = useQuery(api.pushSubscriptions.hasSubscription);

  useEffect(() => {
    // Don't show if already subscribed, no VAPID key, or not supported
    if (hasSubscription) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem("ct-push-dismissed");
    if (dismissedAt) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - Number(dismissedAt) < thirtyDays) return;
    }

    // Check if permission already denied
    if (Notification.permission === "denied") return;

    // Check if already granted and subscribed
    if (Notification.permission === "granted") return;

    // Show prompt after a short delay
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [hasSubscription]);

  const handleEnable = async () => {
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied");
        setIsVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const p256dh = btoa(
        String.fromCharCode(
          ...new Uint8Array(subscription.getKey("p256dh")!)
        )
      );
      const auth = btoa(
        String.fromCharCode(
          ...new Uint8Array(subscription.getKey("auth")!)
        )
      );

      await subscribe({
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      });

      toast.success("Push notifications enabled!");
      setIsVisible(false);
    } catch (err) {
      console.error("Failed to subscribe to push:", err);
      toast.error("Failed to enable notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("ct-push-dismissed", String(Date.now()));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="border-t border-sand px-4 py-3"
        >
          <p className="text-xs font-semibold text-dark-green">
            Stay in the loop
          </p>
          <p className="mt-0.5 text-xs text-dark-green/50">
            Get notified about events, results, and announcements.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleEnable}
              disabled={isSubscribing}
              className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-dark-green transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {isSubscribing ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-dark-green/40 transition-colors hover:text-dark-green/60"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
