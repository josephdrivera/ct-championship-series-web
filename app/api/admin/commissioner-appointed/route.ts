/**
 * POST /api/admin/commissioner-appointed — Super-admin only.
 * Sends congratulations email to a player who is (now) a commissioner.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  isResendConfigured,
  sendCommissionerAppointmentEmail,
} from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { userId: clerkUserId, getToken } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let currentUser;
  try {
    currentUser = await fetchQuery(
      api.users.getCurrentUser,
      {},
      { token }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not verify your session" },
      { status: 500 }
    );
  }

  if (currentUser?.isSuperAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw =
    typeof body.userId === "string" ? body.userId.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const targetUserId = raw as Id<"users">;

  let contact;
  try {
    contact = await fetchQuery(
      api.users.getUserContactForSuperAdmin,
      { userId: targetUserId },
      { token }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load player" },
      { status: 500 }
    );
  }

  if (!contact) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (!contact.isCommissioner) {
    return NextResponse.json(
      {
        error:
          "That player is not a commissioner yet. Save the role change, then try again.",
      },
      { status: 400 }
    );
  }

  if (!contact.email?.trim()) {
    return NextResponse.json({
      success: true,
      emailed: false,
      reason: "no_email",
    });
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured (set RESEND_API_KEY and EMAIL_FROM on the server).",
        emailed: false,
      },
      { status: 503 }
    );
  }

  const siteUrl = getSiteOrigin(request);
  const memberName = contact.name.trim() || "there";

  try {
    await sendCommissionerAppointmentEmail({
      to: contact.email.trim(),
      memberName,
      siteUrl,
    });
  } catch (err: unknown) {
    console.error("[api/admin/commissioner-appointed] send failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to send commissioner email",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, emailed: true });
}
