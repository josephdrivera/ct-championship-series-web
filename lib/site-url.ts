import "server-only";
import type { NextRequest } from "next/server";

/**
 * Ensure a string is a valid http(s) origin (Clerk requires full URLs for redirect_url).
 * Accepts "example.com", "https://example.com", strips trailing slashes and paths.
 */
function normalizeToOrigin(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Canonical public site origin for server-side redirects (invites, emails).
 * Prefer NEXT_PUBLIC_SITE_URL so it matches Clerk Dashboard allowlists (www vs apex).
 * Values without a scheme are treated as https.
 */
export function getSiteOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    const normalized = normalizeToOrigin(fromEnv);
    if (normalized) return normalized;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const normalized = normalizeToOrigin(
      vercel.includes("://") ? vercel : `https://${vercel}`
    );
    if (normalized) return normalized;
  }

  return request.nextUrl.origin;
}

/** Absolute sign-in URL for Clerk invitation `redirect_url` (must be a valid absolute URL). */
export function getSignInUrl(request: NextRequest): string {
  return new URL("/sign-in", getSiteOrigin(request)).href;
}
