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
      <ThemeToggle />
    </header>
  );
}
