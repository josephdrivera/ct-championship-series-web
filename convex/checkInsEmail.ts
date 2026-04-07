/**
 * Commissioner email when a player checks in — Node action (Resend + optional Clerk fallback).
 */
"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

async function resolveEmailFromClerk(
  clerkId: string
): Promise<string | undefined> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key?.trim()) return undefined;
  const res = await fetch(
    `https://api.clerk.com/v1/users/${encodeURIComponent(clerkId)}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) return undefined;
  const data = (await res.json()) as {
    primary_email_address_id?: string | null;
    email_addresses?: { id: string; email_address: string }[];
  };
  const emails = data.email_addresses;
  if (!emails?.length) return undefined;
  const primary =
    data.primary_email_address_id !== undefined &&
    data.primary_email_address_id !== null
      ? emails.find((e) => e.id === data.primary_email_address_id)
      : undefined;
  return primary?.email_address ?? emails[0].email_address;
}

function commissionerEmailHtml(params: {
  appName: string;
  playerName: string;
  eventName: string;
}): string {
  const { appName, playerName, eventName } = params;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#FDF8F0;color:#333;">
<p style="margin:0 0 12px;"><strong>${escapeHtml(playerName)}</strong> checked in for <strong>${escapeHtml(eventName)}</strong>.</p>
<p style="margin:0;font-size:13px;color:#666;">${escapeHtml(appName)}</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const notifyCommissionersOfCheckIn = internalAction({
  args: {
    eventId: v.id("events"),
    checkedInUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const from =
      process.env.EMAIL_FROM ??
      "CT Championship Series <noreply@ctchampionshipseries.com>";
    const appName = process.env.EMAIL_APP_NAME ?? "CT Championship Series";

    if (!resendKey) {
      console.warn("checkInsEmail: RESEND_API_KEY not set; skipping commissioner email");
      return;
    }

    const payload = await ctx.runQuery(
      internal.checkIns.internalGetCommissionerNotificationContext,
      {
        eventId: args.eventId,
        checkedInUserId: args.checkedInUserId,
      }
    );
    if (!payload) return;

    const recipientEmails = new Set<string>();
    for (const s of payload.staff) {
      let email = s.email?.trim();
      if (!email) {
        email = await resolveEmailFromClerk(s.clerkId);
      }
      if (email) recipientEmails.add(email);
    }

    if (recipientEmails.size === 0) {
      console.warn(
        "checkInsEmail: no commissioner emails resolved; sync Clerk webhooks or set CLERK_SECRET_KEY"
      );
      return;
    }

    const html = commissionerEmailHtml({
      appName,
      playerName: payload.playerName,
      eventName: payload.eventName,
    });
    const subject = `Check-in: ${payload.playerName} — ${payload.eventName}`;

    for (const to of recipientEmails) {
      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
      });
      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error("checkInsEmail: Resend error", sendRes.status, errText);
      }
    }
  },
});
