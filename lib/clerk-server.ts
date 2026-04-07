import "server-only";

/**
 * Clerk publishable key for Server Components / layout.
 * Prefer CLERK_PUBLISHABLE_KEY (set in Vercel to the same value as NEXT_PUBLIC_*)
 * if NEXT_PUBLIC inlining ever disagrees with runtime; otherwise NEXT_PUBLIC alone is enough.
 */
export function getClerkPublishableKey(): string | undefined {
  const fromDedicated = process.env.CLERK_PUBLISHABLE_KEY?.trim();
  if (fromDedicated) return fromDedicated;
  const fromPublic = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return fromPublic || undefined;
}
