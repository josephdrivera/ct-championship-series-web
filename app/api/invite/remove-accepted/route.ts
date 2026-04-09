/**
 * POST /api/invite/remove-accepted — Super-admin only.
 * For accepted invitations: emails the member, deletes their Clerk user, then deletes
 * Convex player data (and invitation rows) via deletePlayer.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isResendConfigured, sendMembershipRevokedEmail } from "@/lib/email";
import { getSiteOrigin } from "@/lib/site-url";
import { rejectOversizedPayload } from "@/lib/api-guard";

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

export const runtime = "nodejs";

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

  let currentUser;
  try {
    currentUser = await fetchQuery(
      api.users.getCurrentUser,
      {},
      { token }
    );
  } catch (err: unknown) {
    console.error("[api/invite/remove-accepted] getCurrentUser failed:", err);
    return NextResponse.json(
      { error: convexClientErrorMessage(err) },
      { status: 500 }
    );
  }
  if (!currentUser?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { invitationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawId =
    typeof body.invitationId === "string" ? body.invitationId.trim() : "";
  if (!rawId) {
    return NextResponse.json(
      { error: "invitationId is required" },
      { status: 400 }
    );
  }

  const invitationId = rawId as Id<"leagueInvitations">;

  let detail;
  try {
    detail = await fetchQuery(
      api.invitations.invitationDetailForSuperAdmin,
      { invitationId },
      { token }
    );
  } catch (err: unknown) {
    console.error("[api/invite/remove-accepted] invitation detail failed:", err);
    return NextResponse.json(
      { error: convexClientErrorMessage(err) },
      { status: 500 }
    );
  }

  if (!detail) {
    return NextResponse.json(
      { error: "Invitation not found or access denied" },
      { status: 404 }
    );
  }

  if (detail.status !== "accepted") {
    return NextResponse.json(
      {
        error:
          "Only accepted invitations can be removed this way. Use Cancel invite for pending invitations, or Clear from list if the row is stuck.",
      },
      { status: 400 }
    );
  }

  if (!detail.acceptedUserId) {
    return NextResponse.json(
      {
        error:
          "This record is missing member data. Use Clear from list on the admin page.",
      },
      { status: 400 }
    );
  }

  if (detail.memberIsSuperAdmin) {
    return NextResponse.json(
      { error: "You cannot remove another super admin with this action." },
      { status: 403 }
    );
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

  const siteUrl = getSiteOrigin(request);
  const displayName = detail.memberName?.trim() || "there";

  try {
    await sendMembershipRevokedEmail({
      to: detail.email,
      memberName: displayName,
      siteUrl,
    });
  } catch (err: unknown) {
    console.error("[api/invite/remove-accepted] email failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to send removal email",
      },
      { status: 502 }
    );
  }

  if (detail.memberClerkId) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(detail.memberClerkId);
    } catch (err: unknown) {
      console.warn(
        "[api/invite/remove-accepted] Clerk deleteUser (user may already be deleted):",
        err
      );
    }
  }

  try {
    if (detail.memberExists && detail.acceptedUserId) {
      await fetchMutation(
        api.users.deletePlayer,
        { userId: detail.acceptedUserId },
        { token }
      );
    } else {
      await fetchMutation(
        api.invitations.superAdminForceDeleteInvitationRow,
        { invitationId },
        { token }
      );
    }
  } catch (err: unknown) {
    console.error("[api/invite/remove-accepted] Convex mutation failed:", err);
    return NextResponse.json(
      { error: convexClientErrorMessage(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
