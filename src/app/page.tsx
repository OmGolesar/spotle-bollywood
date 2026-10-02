import { SiteHeader } from "@/components/SiteHeader";
import { ModeCard } from "@/components/ModeCard";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { DIFFICULTIES } from "@/lib/difficulty";
import { istDisplayDate } from "@/lib/dateIst";

type StreakState = { streak: number; playedToday: boolean };
const PLACEHOLDER_STREAKS: Record<string, StreakState> = {
  easy: { streak: 0, playedToday: false },
  medium: { streak: 0, playedToday: false },
  hard: { streak: 0, playedToday: false },
};

export default function Home() {
  const todayLabel = istDisplayDate();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {todayLabel} · IST
          </p>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Guess today&rsquo;s mystery{" "}
            <span style={{ color: "var(--accent)" }}>Bollywood</span> film.
          </h1>
          <p className="max-w-md text-base leading-6 text-muted">
            Ten guesses. Eight colored tiles each. A poster that un-blurs with every try.
            Pick a difficulty to begin.
          </p>
        </section>

        <section
          aria-label="Difficulty modes"
          className="grid gap-4 sm:grid-cols-3"
        >
          {DIFFICULTIES.map((d) => {
            const s = PLACEHOLDER_STREAKS[d];
            return (
              <ModeCard
                key={d}
                difficulty={d}
                streak={s.streak}
                playedToday={s.playedToday}
              />
            );
          })}
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">New puzzle at midnight IST</span>
            <span className="text-xs text-muted">
              Streaks reset after one missed day.
            </span>
          </div>
          <HowToPlaySheet />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-5 pb-8 text-xs text-muted sm:px-8">
        Movie data from TMDB. v1 preview.
      </footer>
    </div>
  );
}
