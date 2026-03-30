"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import NotificationItem from "./NotificationItem";
import PushPermissionPrompt from "./PushPermissionPrompt";

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export default function NotificationDropdown({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    isOpen ? { limit: 20 } : "skip"
  );
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    // Delay the listener to avoid closing immediately
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const hasUnread = notifications?.some((n) => !n.isRead);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-sand bg-white shadow-lg sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sand px-4 py-3">
            <h3 className="font-serif text-sm font-bold text-dark-green">
              Notifications
            </h3>
            {hasUnread && (
              <button
                onClick={() => markAllAsRead({})}
                className="text-xs font-medium text-augusta transition-colors hover:text-deep-green"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications === undefined ? (
              // Loading state
              <div className="space-y-1 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-sand/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-sand/50" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-sand/30" />
                      <div className="h-2 w-16 animate-pulse rounded bg-sand/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center px-6 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/30">
                  <svg
                    className="h-6 w-6 text-dark-green/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-dark-green/50">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-dark-green/30">
                  You&apos;ll see updates here when events are scheduled,
                  scores are posted, and more.
                </p>
              </div>
            ) : (
              // Notification items
              <div className="divide-y divide-sand/50">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Push notification prompt */}
          <PushPermissionPrompt />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
