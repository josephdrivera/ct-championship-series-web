/**
 * POST /api/invite/revoke — Super-admin only.
 * Revokes the invitation in Clerk (invalidates the link), then marks it revoked in Convex.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  revokeClerkInvitation,
  isBenignClerkRevokeFailure,
  getClerkErrorMessage,
} from "@/lib/clerk-revoke-invitation";

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

  const currentUser = await fetchQuery(
    api.users.getCurrentUser,
    {},
    { token }
  );
  if (!currentUser?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { clerkInvitationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clerkInvitationId =
    typeof body.clerkInvitationId === "string"
      ? body.clerkInvitationId.trim()
      : "";

  if (!clerkInvitationId) {
    return NextResponse.json(
      { error: "clerkInvitationId is required" },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();
    await revokeClerkInvitation(client, clerkInvitationId);
  } catch (err: unknown) {
    console.error("[api/invite/revoke] Clerk revoke failed:", err);
    if (!isBenignClerkRevokeFailure(err)) {
      return NextResponse.json(
        { error: getClerkErrorMessage(err) },
        { status: 400 }
      );
    }
    console.warn(
      "[api/invite/revoke] Clerk reported non-fatal state; syncing Convex only:",
      err
    );
  }

  try {
    await fetchMutation(
      api.invitations.markRevoked,
      { clerkInvitationId },
      { token }
    );
  } catch (err: unknown) {
    console.error(
      "[api/invite/revoke] Convex markRevoked failed:",
      err
    );
    const message =
      err instanceof Error
        ? err.message
        : "Could not update invitation status in league records.";
    // 409: invitation already accepted / not cancellable — not a server outage.
    const status = message.includes("Only pending invitations")
      ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ success: true });
}
