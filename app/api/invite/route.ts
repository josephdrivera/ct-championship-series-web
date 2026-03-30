import { NextRequest, NextResponse } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

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

  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress,
      redirectUrl: `${request.nextUrl.origin}/sign-in`,
    });

    return NextResponse.json({ success: true, id: invitation.id });
  } catch (err: any) {
    const message =
      err?.errors?.[0]?.longMessage ||
      err?.message ||
      "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
