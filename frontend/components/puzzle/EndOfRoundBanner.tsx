import "@/frontend/styles/puzzle.css";

type Props = {
  outcome: "won" | "lost";
  guessCount: number;
  answerTitle: string;
  answerYear: number;
  onViewSummary: () => void;
};

export function EndOfRoundBanner({
  outcome,
  guessCount,
  answerTitle,
  answerYear,
  onViewSummary,
}: Props) {
  const summary =
    outcome === "won"
      ? `Solved in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}`
      : "Out of guesses";
  const kicker =
    outcome === "won" ? "शाबाश" : "फिर कल";

  return (
    <div className={`bw-end-banner ${outcome}`} role="status" aria-live="polite">
      <div className="copy">
        <p className="headline">
          {summary}
          <span className="kicker" lang="hi"> · {kicker}</span>
        </p>
        <p className="sub">
          Today&rsquo;s film: <strong>{answerTitle}</strong> ({answerYear})
        </p>
      </div>
      <button type="button" className="bw-end-banner-cta" onClick={onViewSummary}>
        View summary →
      </button>
    </div>
  );
}
