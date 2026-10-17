import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeCard } from "@/components/ModeCard";
import { HowToPlaySheet } from "@/components/HowToPlaySheet";
import { HowItWorks } from "@/components/home/HowItWorks";
import { GameAttributes } from "@/components/home/GameAttributes";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { BollywoodHero } from "@/frontend/components/home/BollywoodHero";
import { StarRail } from "@/frontend/components/motifs/StarRail";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { istDateKey, istDisplayDate } from "@/lib/dateIst";
import { hasSupabaseConfigured } from "@/lib/supabase/env";
import { readStreaks } from "@/lib/server/puzzle";
import { readPlayerId } from "@/lib/playerCookie";

export const dynamic = "force-dynamic";

async function loadStreakState(): Promise<Record<Difficulty, { streak: number; playedToday: boolean }>> {
  const empty = {
    easy: { streak: 0, playedToday: false },
    medium: { streak: 0, playedToday: false },
    hard: { streak: 0, playedToday: false },
  } satisfies Record<Difficulty, { streak: number; playedToday: boolean }>;

  if (!hasSupabaseConfigured()) return empty;

  const playerId = await readPlayerId();
  if (!playerId) return empty;

  try {
    const streaks = await readStreaks(playerId);
    const today = istDateKey();
    return {
      easy: {
        streak: streaks.easy.current_streak,
        playedToday: streaks.easy.last_played_date === today,
      },
      medium: {
        streak: streaks.medium.current_streak,
        playedToday: streaks.medium.last_played_date === today,
      },
      hard: {
        streak: streaks.hard.current_streak,
        playedToday: streaks.hard.last_played_date === today,
      },
    };
  } catch (e) {
    console.error("home: readStreaks failed", e);
    return empty;
  }
}

type HomeSearchParams = {
  code?: string;
  token_hash?: string;
  type?: string;
  next?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  // Supabase sometimes lands the magic-link callback on '/' instead of
  // '/auth/callback' (when Site URL is set to a bare hostname and the
  // email was sent before our emailRedirectTo value was accepted).
  // Catch the auth params here and forward them to our real callback.
  const sp = await searchParams;
  if (sp.code || (sp.token_hash && sp.type)) {
    const q = new URLSearchParams();
    if (sp.code) q.set("code", sp.code);
    if (sp.token_hash) q.set("token_hash", sp.token_hash);
    if (sp.type) q.set("type", sp.type);
    q.set("next", sp.next ?? "/admin");
    redirect(`/auth/callback?${q.toString()}`);
  }

  const todayLabel = istDisplayDate();
  const streakState = await loadStreakState();
  const anyStreak =
    streakState.easy.streak > 0 ||
    streakState.medium.streak > 0 ||
    streakState.hard.streak > 0;

  return (
    <div className="bw-home-root bw-surface-ink">
      <div className="bw-grain-ink" aria-hidden="true" />

      <header className="bw-util-bar">
        <span className="brand-mini">बॉलीवुड स्पॉटल</span>
        {anyStreak && (
          <div className="bw-util-streak">
            <span className="label">Streak</span>
            <span className="streak-chip">
              <span className="star">★</span>
              {streakState.easy.streak}
            </span>
          </div>
        )}
      </header>

      <StarRail side="left" />
      <StarRail side="right" />

      <main className="bw-hero-wrap">
        <BollywoodHero />
        <div className="bw-date-pill">{todayLabel} · IST</div>
        <h1 className="bw-tagline" lang="hi">
          आज की फ़िल्म पहचानिए — दस कोशिशों में
          <span className="bw-tagline-en" lang="en">
            Guess today&rsquo;s film in 10 tries
          </span>
        </h1>
        <a href="/easy" className="bw-pill-mustard">
          <span className="arrow" aria-hidden="true">▶</span>
          PLAY <small>खेलें</small>
        </a>
        <nav className="bw-diff-row" aria-label="Jump to difficulty">
          <Link href="/easy">Easy</Link>
          <Link href="/medium">Medium</Link>
          <Link href="/hard">Hard</Link>
        </nav>
      </main>

      <section aria-label="Difficulty modes" className="bw-section">
        <div className="bw-section-head">
          <span className="eyebrow-stars">★ CHOOSE YOUR MATCHBOX ★</span>
          <h2>
            Three ways to play
            <span className="hi">तीन मुश्किलें · पसंद आपकी</span>
          </h2>
        </div>
        <div className="bw-mode-grid">
          {DIFFICULTIES.map((d) => {
            const s = streakState[d];
            return (
              <ModeCard
                key={d}
                difficulty={d}
                streak={s.streak}
                playedToday={s.playedToday}
              />
            );
          })}
        </div>
      </section>

      <section className="bw-section" style={{ paddingTop: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="bw-info-strip">
          <div className="copy">
            <div className="t">New puzzle at midnight IST</div>
            <div className="s">Streaks reset after one missed day.</div>
          </div>
          <HowToPlaySheet triggerClassName="bw-pill-outline-ink" />
        </div>
        <div className="bw-info-strip">
          <div className="copy">
            <div className="t">Catch up on past puzzles</div>
            <div className="s">Practice mode — no streak impact, unlimited replays.</div>
          </div>
          <Link href="/archive" className="bw-pill-outline-ink">
            Archive →
          </Link>
        </div>
      </section>

      <HowItWorks />
      <GameAttributes />
      <FaqAccordion />

      <section className="bw-section bw-final-cta" aria-label="Play today">
        <a href="/easy" className="bw-pill-mustard">
          <span className="arrow" aria-hidden="true">▶</span>
          PLAY TODAY&rsquo;S FILM <small>खेलें</small>
        </a>
        <p className="bw-eyebrow">★ FREE · ONE FILM A DAY · NO ACCOUNT ★</p>
      </section>

      <footer className="bw-foot">
        <p>
          A game by{" "}
          <a
            href="https://www.linkedin.com/in/om-golesar-173ab12aa/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Om Golesar on LinkedIn"
          >
            Om Golesar
          </a>
          . Questions? Reach me at{" "}
          <a href="mailto:omgolesar99@gmail.com">omgolesar99@gmail.com</a>.
        </p>
        <p>Movie data from TMDB. v1 preview · Bollywood edition.</p>
        <p>
          <a href="/admin">Curator access</a>
        </p>
      </footer>
    </div>
  );
}
