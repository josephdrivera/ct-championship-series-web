/**
 * POST /api/admin/commissioner-appointed — Super-admin only.
 * Sends congratulations email to a player who is (now) a commissioner.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  isResendConfigured,
  sendCommissionerAppointmentEmail,
} from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";

export const runtime = "nodejs";

function convexClientErrorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    const d = err.data;
    if (typeof d === "string") return d;
    if (d !== undefined && d !== null && typeof d === "object" && "message" in d) {
      const m = (d as { message?: unknown }).message;
      if (typeof m === "string") return m;
    }
    if (err.message.length > 0) return err.message;
  }
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** Short retries: UI calls this right after updateUserRole; rare read lag should resolve quickly. */
async function getContactWithCommissionerRetry(
  token: string,
  targetUserId: Id<"users">
) {
  const delaysMs = [0, 80, 160, 240];
  for (const delay of delaysMs) {
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    const contact = await fetchQuery(
      api.users.getUserContactForSuperAdmin,
      { userId: targetUserId },
      { token }
    );
    if (contact?.isCommissioner) {
      return contact;
    }
    if (!contact) {
      return null;
    }
  }
  return fetchQuery(
    api.users.getUserContactForSuperAdmin,
    { userId: targetUserId },
    { token }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId, getToken } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        {
          error:
            "Missing Convex JWT (configure Clerk JWT template named \"convex\").",
        },
        { status: 401 }
      );
    }

    let currentUser;
    try {
      currentUser = await fetchQuery(
        api.users.getCurrentUser,
        {},
        { token }
      );
    } catch (err: unknown) {
      console.error(
        "[api/admin/commissioner-appointed] getCurrentUser failed:",
        err
      );
      return NextResponse.json(
        { error: convexClientErrorMessage(err) },
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
      contact = await getContactWithCommissionerRetry(token, targetUserId);
    } catch (err: unknown) {
      console.error(
        "[api/admin/commissioner-appointed] getUserContactForSuperAdmin failed:",
        err
      );
      return NextResponse.json(
        { error: convexClientErrorMessage(err) },
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
            "That player is not a commissioner yet. Try again in a moment, or save the role change and retry.",
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
  } catch (err: unknown) {
    console.error("[api/admin/commissioner-appointed] unhandled:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
