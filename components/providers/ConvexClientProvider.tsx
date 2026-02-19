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
}: {
  children: ReactNode;
}) {
  // If Clerk keys are not configured, provide Convex without auth
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
