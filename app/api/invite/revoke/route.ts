/**
 * POST /api/invite/revoke — Super-admin only.
 *
 * Revokes the Clerk invitation (critical) then best-effort deletes the Convex
 * row. Convex cleanup failures never cause a 500 — the client also runs a
 * fallback client-side deletion so rows always get cleared.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  revokeClerkInvitation,
  isBenignClerkRevokeFailure,
  getClerkErrorMessage,
} from "@/lib/clerk-revoke-invitation";
import { rejectOversizedPayload } from "@/lib/api-guard";

function extractErrorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    const d = err.data;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && "message" in d) {
      const m = (d as { message?: unknown }).message;
      if (typeof m === "string") return m;
    }
    if (err.message.length > 0) return err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const oversized = rejectOversizedPayload(request);
  if (oversized) return oversized;

  /* ── Auth gate ────────────────────────────────────────────────── */
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let currentUser;
  try {
    currentUser = await fetchQuery(api.users.getCurrentUser, {}, { token });
  } catch (err: unknown) {
    console.error("[api/invite/revoke] getCurrentUser failed:", err);
    return NextResponse.json(
      { error: extractErrorMessage(err) },
      { status: 500 }
    );
  }
  if (currentUser?.isSuperAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* ── Parse body ───────────────────────────────────────────────── */
  let body: { clerkInvitationId?: unknown; invitationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clerkInvitationId =
    typeof body.clerkInvitationId === "string"
      ? body.clerkInvitationId.trim()
      : "";
  const invitationId =
    typeof body.invitationId === "string" ? body.invitationId.trim() : "";

  if (!clerkInvitationId && !invitationId) {
    return NextResponse.json(
      { error: "clerkInvitationId or invitationId is required" },
      { status: 400 }
    );
  }

  /* ── 1. Clerk revoke (the critical step) ──────────────────────── */
  let clerkRevoked = false;
  if (clerkInvitationId) {
    try {
      const client = await clerkClient();
      await revokeClerkInvitation(client, clerkInvitationId);
      clerkRevoked = true;
    } catch (err: unknown) {
      if (isBenignClerkRevokeFailure(err)) {
        clerkRevoked = true;
        console.info(
          "[api/invite/revoke] Clerk invitation already inactive:",
          clerkInvitationId
        );
      } else {
        console.error("[api/invite/revoke] Clerk revoke failed:", err);
        return NextResponse.json(
          { error: getClerkErrorMessage(err) },
          { status: 400 }
        );
      }
    }
  } else {
    clerkRevoked = true;
  }

  /* ── 2. Convex cleanup (best-effort, never causes 500) ────────── */
  const warnings: string[] = [];
  let convexRowDeleted = false;

  // Primary: delete by Clerk invitation ID
  if (clerkInvitationId) {
    try {
      await fetchMutation(
        api.invitations.deleteInvitation,
        { clerkInvitationId },
        { token }
      );
      convexRowDeleted = true;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      console.warn("[api/invite/revoke] deleteInvitation:", msg);
      if (msg.includes("already accepted")) {
        return NextResponse.json(
          { error: "This invitation was already accepted. Use 'Remove from league' instead." },
          { status: 409 }
        );
      }
      warnings.push(msg);
    }
  }

  // Fallback: delete by Convex document ID (only if primary didn't succeed)
  if (!convexRowDeleted && invitationId) {
    try {
      await fetchMutation(
        api.invitations.superAdminForceDeleteInvitationRow,
        { invitationId: invitationId as Id<"leagueInvitations"> },
        { token }
      );
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      console.warn("[api/invite/revoke] forceDeleteRow:", msg);
      warnings.push(msg);
    }
  }

  return NextResponse.json({
    success: true,
    clerkRevoked,
    ...(warnings.length > 0 && { warnings }),
  });
}
