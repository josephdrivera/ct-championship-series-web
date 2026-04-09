/**
 * POST /api/events/remind — Commissioner/super admin only.
 * Sends the reminder template (check-in CTA) to all league members with a synced email.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { isResendConfigured, sendReminderEmail } from "@/lib/email";
import { rejectOversizedPayload } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  const oversized = rejectOversizedPayload(request);
  if (oversized) return oversized;

  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await fetchQuery(api.users.getCurrentUser, {}, { token });
  if (!currentUser?.isCommissioner && !currentUser?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const eventId = body.eventId as string | undefined;
  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured (set RESEND_API_KEY and EMAIL_FROM on the server).",
      },
      { status: 503 }
    );
  }

  const origin = request.nextUrl.origin;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  const eventData = await fetchQuery(api.events.getEventById, {
    eventId: eventId as Id<"events">,
  });

  if (!eventData) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { event, course } = eventData;

  const members = await fetchQuery(
    api.users.listLeagueMembersWithEmail,
    {},
    { token }
  );

  const when = new Date(event.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const details = [course ? `Course: ${course.name}` : null, `Format: ${event.format}`]
    .filter(Boolean)
    .join("\n");

  const checkInUrl = `${origin}/events/${eventId}/check-in`;
  const eventPageUrl = `${origin}/events/${eventId}`;

  let sent = 0;
  const skippedNoEmail: string[] = [];
  const errors: string[] = [];

  for (const m of members) {
    if (!m.email) {
      skippedNoEmail.push(m.name);
      continue;
    }
    try {
      await sendReminderEmail({
        to: m.email,
        eventTitle: event.name,
        eventWhen: when,
        details,
        checkInUrl,
        eventPageUrl,
        siteUrl,
      });
      sent += 1;
    } catch (err) {
      console.error("Reminder send failed for", m.email, err);
      errors.push(
        err instanceof Error ? err.message : "Unknown error sending to " + m.email
      );
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skippedNoEmail,
    errors: errors.length ? errors : undefined,
  });
}
