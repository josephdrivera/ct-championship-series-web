"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const composeRef = useRef<HTMLDivElement>(null);

  const sendAnnouncement = useMutation(api.notifications.sendAnnouncement);
  const deleteAnnouncementBroadcast = useMutation(api.notifications.deleteAnnouncementBroadcast);
  const sentAnnouncements = useQuery(api.notifications.getSentAnnouncements);
  const allPlayers = useQuery(api.players.getAllPlayers);

  const playerCount = allPlayers?.length ?? 0;

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    setIsSending(true);
    try {
      await sendAnnouncement({ title: title.trim(), body: body.trim() });
      toast.success(`Notification sent to ${playerCount} players`);
      setTitle("");
      setBody("");
      setShowConfirm(false);
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = (announcementTitle: string, announcementBody: string) => {
    setTitle(announcementTitle);
    setBody(announcementBody);
    setShowConfirm(false);
    composeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (senderId: string, createdAt: number) => {
    const key = `${senderId}-${createdAt}`;
    setDeletingId(key);
    try {
      await deleteAnnouncementBroadcast({
        senderId: senderId as import("@/convex/_generated/dataModel").Id<"users">,
        createdAt,
      });
      toast.success("Announcement deleted for all players");
    } catch {
      toast.error("Failed to delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Notifications
      </h1>
      <p className="mt-1 text-dark-green/60">
        Send announcements to all players in the league.
      </p>

      {/* Compose Form */}
      <div ref={composeRef} className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-dark-green">
          Compose Announcement
        </h2>
        <p className="mt-1 text-sm text-dark-green/50">
          This will be sent to all {playerCount} registered players.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="notification-title"
              className="block text-sm font-medium text-dark-green"
            >
              Title
            </label>
            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important League Update"
              className="mt-1 w-full rounded-lg border border-sand bg-cream/50 px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/30 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="notification-body"
              className="block text-sm font-medium text-dark-green"
            >
              Message
            </label>
            <textarea
              id="notification-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement here..."
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-sand bg-cream/50 px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/30 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-dark-green/30">
              {body.length}/500 characters
            </p>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!title.trim() || !body.trim()}
              className="rounded-full bg-augusta px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send to All Players
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
              <p className="flex-1 text-sm text-dark-green">
                Send this notification to{" "}
                <span className="font-semibold">{playerCount} players</span>?
              </p>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSending}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-dark-green/60 transition-colors hover:text-dark-green"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="rounded-full bg-augusta px-4 py-1.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Confirm Send"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sent History */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-bold text-dark-green">
          Sent Announcements
        </h2>

        {sentAnnouncements === undefined ? (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-1/3 rounded bg-sand/50" />
                <div className="mt-2 h-3 w-2/3 rounded bg-sand/30" />
                <div className="mt-2 h-2.5 w-24 rounded bg-sand/20" />
              </div>
            ))}
          </div>
        ) : sentAnnouncements.length === 0 ? (
          <p className="mt-4 text-sm text-dark-green/50">
            No announcements sent yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {sentAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-dark-green">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 text-sm text-dark-green/60">
                      {announcement.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleResend(announcement.title, announcement.body)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-augusta transition-colors hover:bg-emerald-50 hover:text-deep-green"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend
                    </button>
                    <button
                      onClick={() =>
                        announcement.senderId &&
                        handleDelete(announcement.senderId, announcement.createdAt)
                      }
                      disabled={deletingId === `${announcement.senderId}-${announcement.createdAt}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deletingId === `${announcement.senderId}-${announcement.createdAt}` ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-dark-green/40">
                  <span>By {announcement.senderName}</span>
                  <span>&middot;</span>
                  <span>{formatDate(announcement.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
