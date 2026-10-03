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
    a: "500 of the most watched Hindi films on TMDB in Easy mode, 1,500 in Medium, and the full 3,000+ catalogue in Hard — including parallel, cult and regional-breakout cinema.",
  },
  {
    q: "Why isn't my film showing up in the search?",
    a: "Only films in that difficulty's pool can be guessed. If a film you're searching for isn't appearing, it's either outside the top-rated set or hasn't been indexed yet. Hard mode has the widest catalogue.",
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
    a: "Close (yellow) depends on the attribute. Year is within 5 years, box office within 50%, IMDb within 1.0. For director and music, close means two people in the same frequent-collaborator cluster.",
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
