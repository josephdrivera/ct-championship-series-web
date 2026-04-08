"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

/**
 * Convex + Clerk provider. Subscriptions created by useQuery and
 * usePreloadedQuery are automatically cleaned up when components unmount.
 * Conditional queries use the "skip" sentinel to defer execution until
 * required arguments are available.
 */
export default function ConvexClientProvider({
  children,
  clerkPublishableKey,
}: {
  children: ReactNode;
  /** From `app/layout.tsx` via `getClerkPublishableKey()` (server runtime). */
  clerkPublishableKey?: string;
}) {
  const key = clerkPublishableKey?.trim() || null;

  return key ? (
    <ClerkProvider publishableKey={key} signInUrl="/sign-in" signUpUrl="/sign-up">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  ) : (
    <ConvexProvider client={convex}>{children}</ConvexProvider>
  );
}
