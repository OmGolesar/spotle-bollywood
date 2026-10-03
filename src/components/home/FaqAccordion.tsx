const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Spotle Bollywood?",
    a: "A daily puzzle where you guess one mystery Hindi film in ten tries. Each guess reveals eight comparison tiles and gradually un-blurs the poster.",
  },
  {
    q: "When does the daily film reset?",
    a: "At midnight IST. Everyone playing on the same calendar day in India plays the same film.",
  },
  {
    q: "What films can show up?",
    a: "You can guess any film in our 3,000+ Hindi film catalogue regardless of difficulty. Difficulty controls which film is picked as today's mystery — Easy picks modern blockbusters, Medium well-known hits across decades, Hard adds parallel, cult and deep-cut cinema.",
  },
  {
    q: "Why isn't my film showing up in the search?",
    a: "The catalogue is 3,000+ films but not exhaustive — some older or less-reviewed films are missing. If a title you expected isn't appearing, drop me a line via the footer and I'll check whether it should be added.",
  },
  {
    q: "Can I play yesterday's puzzle?",
    a: "Not yet — the archive is coming soon. For now each day's puzzle is one-shot.",
  },
  {
    q: "How do hints work?",
    a: "You get two hints per play, unlocked after your third and sixth guess. Each hint reveals one of: tagline, filmography, or a cast member — you pick which.",
  },
  {
    q: "What counts as a close match?",
    a: "Close (yellow) depends on the attribute. Year is within 5 years. Box office is within 50% of the answer's gross. IMDb is within 0.5 points — green means both films display the exact same rating. Director and music turn yellow when the two people are frequent collaborators (same cluster across films).",
  },
  {
    q: "What does the box-office figure represent?",
    a: "Worldwide gross from TMDB, converted to an approximate crore equivalent for the display. It's not the same as India-only collections — this metric is used so the game can score large and small releases on the same scale.",
  },
  {
    q: "What are the three difficulty modes?",
    a: "Easy covers 500 modern blockbusters. Medium covers 1,500 well-known hits across decades. Hard adds parallel, cult and deep-cut cinema from the full catalogue — streaks there are the real brag.",
  },
  {
    q: "Does the site track me?",
    a: "No login required for playing. A single cookie stores your streaks and today's progress. No analytics, no third-party trackers.",
  },
];

export function FaqAccordion() {
  return (
    <section
      aria-label="Frequently asked questions"
      className="flex flex-col gap-5 border-t border-border pt-10 sm:pt-14"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Questions from the audience
      </p>
      <div className="flex flex-col gap-2">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-border bg-surface open:bg-surface-muted"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-foreground sm:text-base">
              <span>{f.q}</span>
              <span
                aria-hidden="true"
                className="shrink-0 text-xl font-light text-accent transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-6 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
