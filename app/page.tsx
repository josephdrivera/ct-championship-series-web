export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-cream px-6">
      <h1 className="font-serif text-5xl font-bold tracking-tight text-dark-green">
        CT Championship Series
      </h1>
      <p className="mt-4 max-w-lg text-center text-lg text-dark-green/70">
        The official tournament platform for tracking scores, standings, and
        history across every season of the CT Championship Series.
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/leaderboard"
          className="rounded-full bg-augusta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-deep-green"
        >
          View Leaderboard
        </a>
        <a
          href="/events"
          className="rounded-full border border-augusta px-6 py-3 text-sm font-semibold text-augusta transition-colors hover:bg-augusta hover:text-cream"
        >
          Upcoming Events
        </a>
      </div>
    </main>
  );
}
