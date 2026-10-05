import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ArchiveGrid } from "@/components/ArchiveGrid";
import { loadArchiveGrid } from "@/lib/server/archive";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { hasSupabaseConfigured } from "@/lib/supabase/env";
import { readPlayerId } from "@/lib/playerCookie";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Spotle Bollywood — Archive",
  description: "Replay previous Spotle Bollywood puzzles. Practice mode.",
};

type SearchParams = { difficulty?: string };

export default async function ArchiveIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = sp.difficulty;
  const difficulty: Difficulty = (DIFFICULTIES as readonly string[]).includes(
    raw ?? ""
  )
    ? (raw as Difficulty)
    : "easy";

  const configured = hasSupabaseConfigured();
  const playerId = configured ? await readPlayerId() : null;
  const grid = configured
    ? await loadArchiveGrid(playerId, difficulty)
    : { difficulty, total: 0, playedCount: 0, cards: [] };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 pb-16 pt-4 sm:px-8 sm:pt-8">
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Archive · practice mode
          </p>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Rewatch
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Missed a day? Replay any previous Spotle Bollywood puzzle. These
            don&rsquo;t affect your streak and aren&rsquo;t saved. Posters
            unlock after you&rsquo;ve played that day in the daily flow.
          </p>
        </section>

        {!configured ? (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
            Backend not configured.
          </div>
        ) : grid.cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No past puzzles scheduled for {difficulty} yet.
          </div>
        ) : (
          <ArchiveGrid
            difficulty={difficulty}
            cards={grid.cards}
            playedCount={grid.playedCount}
          />
        )}

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-muted underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
