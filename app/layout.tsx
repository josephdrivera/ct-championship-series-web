import type { Metadata } from "next";
import { connection } from "next/server";
import { Analytics } from "@vercel/analytics/next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import PresenceHeartbeat from "@/components/presence/PresenceHeartbeat";
import { getClerkPublishableKey } from "@/lib/clerk-server";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CT Championship Series",
  description:
    "The official tournament platform for the CT Championship Series golf league.",
  manifest: "/manifest.json",
  other: {
    "theme-color": "#002E1F",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CT Golf",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const clerkPublishableKey = getClerkPublishableKey();

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <ConvexClientProvider clerkPublishableKey={clerkPublishableKey}>
          <PresenceHeartbeat />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#FDF8F0",
                border: "1px solid #E8DFD0",
                color: "#002E1F",
              },
            }}
          />
          <Header clerkPublishableKey={clerkPublishableKey} />
          {children}
          <CookieBanner />
          <ServiceWorkerRegistrar />
          <Analytics />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
