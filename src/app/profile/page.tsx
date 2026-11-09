import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfileEditor } from "@/components/auth/ProfileEditor";
import { getCurrentUser } from "@/lib/auth/server";
import { readStreaks } from "@/lib/server/puzzle";
import { getUserPlayerId } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  // Get user's player ID and stats
  const playerId = await getUserPlayerId(user.id);
  let stats = {
    easy: { currentStreak: 0, maxStreak: 0, totalPlays: 0, totalWins: 0 },
    medium: { currentStreak: 0, maxStreak: 0, totalPlays: 0, totalWins: 0 },
    hard: { currentStreak: 0, maxStreak: 0, totalPlays: 0, totalWins: 0 },
  };

  if (playerId) {
    try {
      const streaks = await readStreaks(playerId);
      stats = {
        easy: {
          currentStreak: streaks.easy.current_streak,
          maxStreak: streaks.easy.max_streak,
          totalPlays: streaks.easy.total_plays,
          totalWins: streaks.easy.total_wins,
        },
        medium: {
          currentStreak: streaks.medium.current_streak,
          maxStreak: streaks.medium.max_streak,
          totalPlays: streaks.medium.total_plays,
          totalWins: streaks.medium.total_wins,
        },
        hard: {
          currentStreak: streaks.hard.current_streak,
          maxStreak: streaks.hard.max_streak,
          totalPlays: streaks.hard.total_plays,
          totalWins: streaks.hard.total_wins,
        },
      };
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  const totalPlays = stats.easy.totalPlays + stats.medium.totalPlays + stats.hard.totalPlays;
  const totalWins = stats.easy.totalWins + stats.medium.totalWins + stats.hard.totalWins;
  const winRate = totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Your Account
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Profile
          </h1>
        </div>

        {/* Profile Editor */}
        <ProfileEditor user={user} />

        {/* Stats Summary */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Your Stats
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {totalPlays}
              </span>
              <span className="text-xs text-muted">Games Played</span>
            </div>

            <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {totalWins}
              </span>
              <span className="text-xs text-muted">Games Won</span>
            </div>

            <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {winRate}%
              </span>
              <span className="text-xs text-muted">Win Rate</span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            By Difficulty
          </h2>

          <div className="flex flex-col gap-2">
            {[
              { key: "easy" as const, label: "Easy" },
              { key: "medium" as const, label: "Medium" },
              { key: "hard" as const, label: "Hard" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted">
                    {stats[key].totalWins} wins in {stats[key].totalPlays} games
                  </span>
                </div>
                <div className="flex gap-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {stats[key].currentStreak}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted">
                      Current
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {stats[key].maxStreak}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted">Best</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
