import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-cream px-6">
      <div className="max-w-md text-center">
        <p className="font-serif text-6xl font-bold text-gold">404</p>
        <h1 className="mt-4 font-serif text-3xl font-bold text-dark-green">
          Page Not Found
        </h1>
        <p className="mt-3 text-dark-green/60">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-augusta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
