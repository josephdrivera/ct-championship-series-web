"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  announcement: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    color: "text-gold bg-gold/10",
  },
  event_created: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-emerald-600 bg-emerald-50",
  },
  event_completed: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: "text-gold bg-gold/10",
  },
  event_canceled: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-red-500 bg-red-50",
  },
  season_started: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
    color: "text-emerald-700 bg-emerald-50",
  },
  score_result: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "text-blue-600 bg-blue-50",
  },
  system: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-dark-green/60 bg-dark-green/5",
  },
};

function getDeepLink(notification: Doc<"notifications">): string {
  switch (notification.type) {
    case "event_created":
    case "event_completed":
    case "score_result":
      return notification.eventId ? `/events/${notification.eventId}` : "/events";
    case "event_canceled":
      return "/events";
    case "season_started":
      return "/leaderboard";
    default:
      return "/";
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Doc<"notifications">;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const markAsRead = useMutation(api.notifications.markAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    const url = getDeepLink(notification);
    onNavigate?.();
    router.push(url);
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification({ notificationId: notification._id });
  };

  return (
    <div
      className={`group relative border-l-2 transition-colors hover:bg-sand/30 ${
        notification.isRead
          ? "border-transparent bg-white"
          : "border-gold bg-gold/5"
      }`}
    >
      <button
        onClick={handleClick}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}
        >
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dark-green">
            {notification.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-dark-green/60">
            {notification.body}
          </p>
          <p className="mt-1 text-xs text-dark-green/40">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" />
        )}
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-dark-green/30 opacity-0 transition-all hover:bg-sand/50 hover:text-dark-green/60 group-hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
