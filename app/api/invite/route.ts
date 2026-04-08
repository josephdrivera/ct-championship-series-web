/**
 * POST /api/invite — Super-admin only.
 * Creates a Clerk invitation with notify: false, then sends `templates/emails/invitation.html` via Resend (INVITATION_URL from Clerk).
 * Requires RESEND_API_KEY + verified EMAIL_FROM. Authorization: Clerk session + JWT "convex" for getCurrentUser.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { isResendConfigured, sendInvitationEmail } from "@/lib/email";

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

  if (!isResendConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured (set RESEND_API_KEY and EMAIL_FROM on the server).",
      },
      { status: 503 }
    );
  }

  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress,
      redirectUrl: signInUrl,
      notify: false,
    });

    const invitationUrl = invitation.url;
    if (!invitationUrl) {
      return NextResponse.json(
        {
          error:
            "Invitation was created but Clerk did not return an invitation URL. Try again or check the Clerk dashboard.",
        },
        { status: 502 }
      );
    }

    try {
      await sendInvitationEmail({
        to: emailAddress,
        invitationUrl,
      });
    } catch (emailErr) {
      console.error("Resend invitation email failed:", emailErr);
      return NextResponse.json(
        {
          error:
            emailErr instanceof Error
              ? emailErr.message
              : "Failed to send invitation email",
          invitationId: invitation.id,
        },
        { status: 502 }
      );
    }

    try {
      await fetchMutation(
        api.invitations.recordSent,
        { clerkInvitationId: invitation.id, email: emailAddress },
        { token }
      );
    } catch (recordErr) {
      console.error("Failed to record invitation in Convex:", recordErr);
    }

    return NextResponse.json({ success: true, id: invitation.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: invitationErrorMessage(err) },
      { status: 400 }
    );
  }
}
