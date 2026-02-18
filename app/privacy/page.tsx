import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CT Championship Series",
  description: "Privacy policy for the CT Championship Series golf league.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-dark-green/50">
          Last updated: February 17, 2026
        </p>

        <div className="mt-10 space-y-8 text-dark-green/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Information We Collect
            </h2>
            <p className="mt-3">
              The CT Championship Series collects the following information when
              you create an account:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Name and email address (provided via Clerk authentication)</li>
              <li>Profile photo (optional, from your authentication provider)</li>
              <li>Golf handicap (optional, entered manually)</li>
              <li>Golf scores and tournament results submitted during events</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              How We Use Your Information
            </h2>
            <p className="mt-3">
              Your information is used solely to operate the league platform:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Displaying leaderboards, standings, and player profiles</li>
              <li>Calculating points, rankings, and tournament results</li>
              <li>Authenticating your identity for secure access</li>
              <li>Communicating league announcements and event details</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Data Storage
            </h2>
            <p className="mt-3">
              Your data is stored securely using Convex, a cloud-hosted
              database. Authentication is handled by Clerk, a third-party
              authentication service. Both services maintain industry-standard
              security practices.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Cookies
            </h2>
            <p className="mt-3">
              This site uses only essential cookies required for authentication
              and session management. We do not use tracking cookies, analytics
              cookies, or advertising cookies. No data is shared with
              third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Third-Party Sharing
            </h2>
            <p className="mt-3">
              We do not sell, trade, or share your personal information with
              third parties. Your data is only accessible to league
              commissioners for administrative purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Your Rights
            </h2>
            <p className="mt-3">
              You may request access to, correction of, or deletion of your
              personal data at any time by contacting a league commissioner.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Contact
            </h2>
            <p className="mt-3">
              For questions about this privacy policy, please contact your
              league commissioner.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-sand pt-6">
          <Link
            href="/terms"
            className="text-sm font-medium text-augusta hover:text-deep-green"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </main>
  );
}
