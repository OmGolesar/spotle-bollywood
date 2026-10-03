import { GuessCard } from "@/components/GuessCard";
import {
  DEMO_PARTIAL_MOVIE,
  DEMO_PARTIAL_TILES,
  DEMO_WIN_MOVIE,
  DEMO_WIN_TILES,
} from "./demoCardData";

function StepHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="font-display text-3xl font-semibold tabular-nums leading-none text-accent sm:text-4xl"
      >
        {index}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted sm:text-base">{description}</p>
      </div>
    </div>
  );
}

function SearchDemo() {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-muted">🔍</span>
        <span className="font-mono text-sm text-foreground">Lagaan</span>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      aria-label="How it works"
      className="flex flex-col gap-6 border-t border-border pt-10 sm:gap-8 sm:pt-14"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        How it works
      </p>

      <div className="flex flex-col gap-6">
        <article className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <StepHeader
            index="01"
            title="Type any Bollywood film"
            description={
              <>
                Search our pool of 500+ Hindi films and pick a title from the dropdown.
                Each guess reveals eight comparison tiles.
              </>
            }
          />
          <SearchDemo />
        </article>

        <article className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <StepHeader
            index="02"
            title="Read the tiles"
            description={
              <>
                Each tile shows how close your guess is.{" "}
                <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ background: "var(--tile-green)" }}>Green</span> is exact,{" "}
                <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-black" style={{ background: "var(--tile-yellow)" }}>gold</span> is close, grey is no match. Arrows hint higher or lower.
              </>
            }
          />
          <div className="pt-1">
            <GuessCard movie={DEMO_PARTIAL_MOVIE} tiles={DEMO_PARTIAL_TILES} guessIndex={0} />
          </div>
        </article>

        <article className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <StepHeader
            index="03"
            title="Zero in on the answer"
            description={
              <>
                Narrow it down with the clues. You have ten guesses and two hints — tagline,
                filmography or cast — to crack today&rsquo;s mystery film.
              </>
            }
          />
          <div className="pt-1">
            <GuessCard movie={DEMO_WIN_MOVIE} tiles={DEMO_WIN_TILES} guessIndex={5} />
          </div>
        </article>
      </div>
    </section>
  );
}
