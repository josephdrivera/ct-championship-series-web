import "server-only";
import type { NextRequest } from "next/server";

/**
 * Canonical public site origin for server-side redirects (invites, emails).
 * Prefer NEXT_PUBLIC_SITE_URL so it matches Clerk Dashboard allowlists (www vs apex).
 */
export function getSiteOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return request.nextUrl.origin;
}
