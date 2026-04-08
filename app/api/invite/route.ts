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
import { getSiteOrigin } from "@/lib/site-url";

type ClerkErrBody = {
  errors?: Array<{
    code?: string;
    message?: string;
    longMessage?: string;
  }>;
  status?: number;
};

/** Clerk often nests `errors` on the thrown value or on `cause`. */
function unwrapClerkErrorList(err: unknown): ClerkErrBody["errors"] | undefined {
  let current: unknown = err;
  for (let depth = 0; depth < 8; depth++) {
    if (!current || typeof current !== "object") return undefined;
    const o = current as ClerkErrBody;
    if (Array.isArray(o.errors) && o.errors.length > 0) {
      return o.errors;
    }
    const cause = (o as { cause?: unknown }).cause;
    if (cause) {
      current = cause;
      continue;
    }
    break;
  }
  return undefined;
}

function parseClerkInvitationFailure(
  err: unknown,
  signInUrl: string
): { message: string; status: number } {
  const fallback = "Failed to send invitation";

  const errors = unwrapClerkErrorList(err);
  if (errors?.length) {
    return mapClerkErrors(errors, signInUrl);
  }

  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: string }).message;
    if (typeof msg === "string" && msg.length > 0) {
      return { message: msg, status: (err as ClerkErrBody).status ?? 400 };
    }
  }

  if (err instanceof Error) {
    return { message: err.message || fallback, status: 400 };
  }

  return { message: fallback, status: 400 };
}

function mapClerkErrors(
  errors: NonNullable<ClerkErrBody["errors"]>,
  signInUrl: string
): { message: string; status: number } {
  const first = errors[0];
  const code = first?.code ?? "";
  const message =
    first?.longMessage ?? first?.message ?? "Failed to send invitation";

  // User already registered — cannot invite
  if (
    code === "form_identifier_exists" ||
    /identifier.*exist|already.*registered|already exists/i.test(message)
  ) {
    return {
      message:
        "That email already has an account. They can sign in with that address; you cannot send a new invite.",
      status: 409,
    };
  }

  // Pending invite already exists for this email
  if (
    code === "duplicate_record" ||
    /duplicate|already.*invit/i.test(message)
  ) {
    return {
      message:
        "An invitation for that email is already pending. Revoke it in the Clerk dashboard or wait until it is accepted.",
      status: 409,
    };
  }

  // Redirect URL must be in Clerk Dashboard → Paths → Allowed redirect URLs
  if (
    /redirect/i.test(code) ||
    /redirect url|not allowed|invalid.*redirect/i.test(message)
  ) {
    return {
      message: `${message} Add this exact URL to Clerk: ${signInUrl} (Dashboard → Configure → Paths).`,
      status: 400,
    };
  }

  return { message, status: 400 };
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
  const rawEmail = body?.emailAddress;
  const emailAddress =
    typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!emailAddress) {
    return NextResponse.json(
      { error: "Email address is required" },
      { status: 400 }
    );
  }

  const signInUrl = `${getSiteOrigin(request)}/sign-in`;

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
    console.error("[api/invite] Clerk createInvitation failed:", err);
    const { message, status } = parseClerkInvitationFailure(err, signInUrl);
    return NextResponse.json({ error: message }, { status });
  }
}
