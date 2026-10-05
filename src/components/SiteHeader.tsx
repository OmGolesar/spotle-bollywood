import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
      <a
        href="/"
        className="flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Spotle
        </span>
        <span
          className="font-display text-xl font-semibold tracking-tight sm:text-2xl"
          style={{ color: "var(--accent)" }}
        >
          Bollywood
        </span>
      </a>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/archive"
          className="hidden h-10 items-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-muted sm:inline-flex"
        >
          Archive
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
