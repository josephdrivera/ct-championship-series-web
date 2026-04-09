/**
 * POST /api/invite/revoke — Super-admin only.
 * Revokes the invitation in Clerk (invalidates the link), then deletes the Convex row.
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

function statusForConvexMutationFailure(message: string): number {
  if (
    message.includes("Super admin access required") ||
    message.includes("Authentication required")
  ) {
    return 403;
  }
  if (
    message.includes("already accepted") ||
    message.includes("Only pending invitations")
  ) {
    return 409;
  }
  return 500;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
    currentUser = await fetchQuery(
      api.users.getCurrentUser,
      {},
      { token }
    );
  } catch (err: unknown) {
    console.error("[api/invite/revoke] getCurrentUser failed:", err);
    return NextResponse.json(
      { error: convexClientErrorMessage(err) },
      { status: 500 }
    );
  }
  if (currentUser?.isSuperAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const invitationIdRaw =
    typeof body.invitationId === "string" ? body.invitationId.trim() : "";

  if (!clerkInvitationId && !invitationIdRaw) {
    return NextResponse.json(
      { error: "clerkInvitationId or invitationId is required" },
      { status: 400 }
    );
  }

  let clerkAlreadyRevoked = false;
  if (clerkInvitationId) {
    try {
      const client = await clerkClient();
      await revokeClerkInvitation(client, clerkInvitationId);
    } catch (err: unknown) {
      if (!isBenignClerkRevokeFailure(err)) {
        console.error("[api/invite/revoke] Clerk revoke failed:", err);
        return NextResponse.json(
          { error: getClerkErrorMessage(err) },
          { status: 400 }
        );
      }
      clerkAlreadyRevoked = true;
      console.warn(
        "[api/invite/revoke] Clerk invitation already inactive; checking Convex sync:",
        err
      );
    }
  } else {
    clerkAlreadyRevoked = true;
  }

  // Clerk may have revoked first (or webhook deleted our row). If Convex already
  // has no rows, skip fetchMutation — avoids a no-op mutation when prod hides errors.
  if (clerkAlreadyRevoked && clerkInvitationId) {
    try {
      const sync = await fetchQuery(
        api.invitations.invitationRowsForAdminRevoke,
        { clerkInvitationId },
        { token }
      );
      if (!sync.ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (sync.hasAccepted) {
        return NextResponse.json(
          {
            error:
              "This invitation was already accepted; it cannot be removed from the list.",
          },
          { status: 409 }
        );
      }
    } catch (err: unknown) {
      console.error(
        "[api/invite/revoke] invitationRowsForAdminRevoke failed:",
        err
      );
      // Fall through to deleteInvitation so we still try to clear pending rows.
    }
  }

  if (clerkInvitationId) {
    try {
      await fetchMutation(
        api.invitations.deleteInvitation,
        { clerkInvitationId },
        { token }
      );
    } catch (err: unknown) {
      console.error("[api/invite/revoke] Convex deleteInvitation failed:", err);
      const message = convexClientErrorMessage(err);
      const status = statusForConvexMutationFailure(message);
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Best-effort: delete by Convex document id (fixes stuck rows / Clerk id mismatch).
  if (invitationIdRaw) {
    try {
      await fetchMutation(
        api.invitations.superAdminForceDeleteInvitationRow,
        { invitationId: invitationIdRaw as Id<"leagueInvitations"> },
        { token }
      );
    } catch (err: unknown) {
      console.warn(
        "[api/invite/revoke] optional invitationId cleanup:",
        err
      );
    }
  }

  return NextResponse.json({ success: true });
}
