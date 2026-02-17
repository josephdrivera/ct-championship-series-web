import Link from "next/link";

const navLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/events", label: "Events" },
  { href: "/players", label: "Players" },
  { href: "/history", label: "History" },
];

export default function Header() {
  return (
    <header className="bg-dark-green">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-3xl font-bold tracking-tight text-gold">
            CS
          </span>
          <span className="hidden text-sm font-medium tracking-widest text-cream/80 uppercase sm:inline">
            Championship Series
          </span>
        </Link>

        <ul className="flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium tracking-wide text-cream/70 transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
