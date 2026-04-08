/**
 * POST /api/invite/revoke — Super-admin only.
 * Revokes the invitation in Clerk (invalidates the link), then deletes the Convex row.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
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
  return String(err);
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
      api.invitations.deleteInvitation,
      { clerkInvitationId },
      { token }
    );
  } catch (err: unknown) {
    console.error("[api/invite/revoke] Convex deleteInvitation failed:", err);
    const message = convexClientErrorMessage(err);
    const conflict =
      message.includes("already accepted") ||
      message.includes("Only pending invitations");
    const status = conflict ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ success: true });
}
