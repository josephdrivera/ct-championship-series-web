import Image from "next/image";
import Link from "next/link";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import HomeContent from "./HomeContent";

export default async function Home() {
  const preloadedSeason = await preloadQuery(api.seasons.getActiveSeason);
  const season = preloadedQueryResult(preloadedSeason);

  if (!season) {
    return (
      <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <Image
          src="/images/default-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-green/80 via-dark-green/60 to-midnight/90" />
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold/80">
            Coming Soon
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            The <span className="text-gold">Championship</span>
            <br />
            Series
          </h1>
          <p className="mt-6 text-lg text-cream/60">
            Your private tour experience
          </p>
          <div className="mt-10">
            <Link
              href="/sign-in"
              className="inline-block rounded-full border border-cream/30 px-8 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-cream hover:bg-cream/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const preloadedStandings = await preloadQuery(
    api.standings.getSeasonStandings,
    { seasonId: season._id }
  );

  const preloadedEvents = await preloadQuery(api.events.getSeasonEvents, {
    seasonId: season._id,
  });

  return (
    <HomeContent
      preloadedSeason={preloadedSeason}
      preloadedStandings={preloadedStandings}
      preloadedEvents={preloadedEvents}
    />
  );
}
