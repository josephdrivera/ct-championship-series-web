/**
 * POST /api/invite/revoke — Super-admin only.
 * Revokes the invitation in Clerk (invalidates the link), then marks it revoked in Convex.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

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
    await client.invitations.revokeInvitation(clerkInvitationId);
  } catch (err: unknown) {
    console.error("[api/invite/revoke] Clerk revokeInvitation failed:", err);
    const message =
      err && typeof err === "object" && "errors" in err
        ? String(
            (err as { errors?: { message?: string }[] }).errors?.[0]?.message ??
              "Failed to revoke invitation in Clerk"
          )
        : err instanceof Error
          ? err.message
          : "Failed to revoke invitation in Clerk";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await fetchMutation(
      api.invitations.markRevoked,
      { clerkInvitationId },
      { token }
    );
  } catch (err: unknown) {
    console.error(
      "[api/invite/revoke] Convex markRevoked failed (Clerk already revoked):",
      err
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Invitation was revoked in Clerk but could not update league records.",
        clerkOnly: true,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
