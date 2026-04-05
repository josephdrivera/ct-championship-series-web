/**
 * POST /api/invite — Super-admin only.
 * Creates a Clerk invitation, then sends optional branded email via Resend (Vercel env: RESEND_API_KEY, EMAIL_FROM).
 * Authorization: Clerk session + JWT template "convex" for Convex fetchQuery(api.users.getCurrentUser).
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendInviteEmail } from "@/lib/email";

function invitationErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const o = err as {
      errors?: { longMessage?: string }[];
      message?: string;
    };
    return o.errors?.[0]?.longMessage ?? o.message ?? "Failed to send invitation";
  }
  if (err instanceof Error) return err.message;
  return "Failed to send invitation";
}

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user has super admin privileges
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

  const body = await request.json();
  const { emailAddress } = body;

  if (!emailAddress || typeof emailAddress !== "string") {
    return NextResponse.json(
      { error: "Email address is required" },
      { status: 400 }
    );
  }

  const signInUrl = `${request.nextUrl.origin}/sign-in`;

  try {
    // Create the Clerk invitation (handles sign-up flow)
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress,
      redirectUrl: signInUrl,
    });

    // Send the branded welcome email
    try {
      await sendInviteEmail({ to: emailAddress, signInUrl });
    } catch (emailErr) {
      // Log but don't fail the invitation if the email fails —
      // Clerk's default email still goes out as a fallback
      console.error("Branded invite email failed:", emailErr);
    }

    return NextResponse.json({ success: true, id: invitation.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: invitationErrorMessage(err) },
      { status: 400 }
    );
  }
}
