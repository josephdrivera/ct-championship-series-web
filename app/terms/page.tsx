import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | CT Championship Series",
  description: "Terms of service for the CT Championship Series golf league.",
};

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-dark-green">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-dark-green/50">
          Last updated: February 17, 2026
        </p>

        <div className="mt-10 space-y-8 text-dark-green/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Acceptance of Terms
            </h2>
            <p className="mt-3">
              By accessing and using the CT Championship Series platform, you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Eligibility
            </h2>
            <p className="mt-3">
              The CT Championship Series is a private golf league. Membership
              and participation are by invitation only. You must be an approved
              member of the league to access scoring, event, and administrative
              features.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Account Responsibilities
            </h2>
            <p className="mt-3">
              You are responsible for maintaining the security of your account
              credentials. You agree to provide accurate information when
              submitting scores and other league data. Commissioners reserve the
              right to modify or remove inaccurate submissions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              League Rules
            </h2>
            <p className="mt-3">
              All participants agree to abide by the league rules and
              regulations as determined by the commissioners. Tournament
              formats, scoring rules, handicap policies, and point allocations
              are set at the discretion of the league administration.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Content Ownership
            </h2>
            <p className="mt-3">
              Scores, statistics, and other data submitted to the platform
              become part of the league&apos;s official records. The platform
              and its design, code, and branding are owned by the CT
              Championship Series.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Limitation of Liability
            </h2>
            <p className="mt-3">
              The CT Championship Series platform is provided &quot;as is&quot;
              without warranties of any kind. We are not liable for any damages
              arising from your use of the platform, including but not limited
              to data loss, scoring errors, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Modifications
            </h2>
            <p className="mt-3">
              We reserve the right to update these terms at any time. Continued
              use of the platform after changes constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-dark-green">
              Contact
            </h2>
            <p className="mt-3">
              For questions about these terms, please contact your league
              commissioner.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-sand pt-6">
          <Link
            href="/privacy"
            className="text-sm font-medium text-augusta hover:text-deep-green"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </main>
  );
}
