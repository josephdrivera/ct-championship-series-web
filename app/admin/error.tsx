"use client";

import Link from "next/link";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-dark-green">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-dark-green/60">
          An error occurred in the admin panel. Please try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
          >
            Try Again
          </button>
          <Link
            href="/admin"
            className="rounded-full border border-dark-green/20 px-5 py-2.5 text-sm font-semibold text-dark-green transition-colors hover:bg-sand"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
