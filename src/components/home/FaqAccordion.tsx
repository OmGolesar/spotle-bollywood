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
    a: "Close (mustard) depends on the attribute. Year is within 5 years. Box office is within 50% of the answer's gross. IMDb is within 0.5 points — teal means both films display the exact same rating. Director and music turn mustard when the two people are frequent collaborators (same cluster across films).",
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
    <section aria-label="Frequently asked questions" className="bw-section">
      <div className="bw-section-head">
        <span className="eyebrow-stars">★ QUESTIONS FROM THE AUDIENCE ★</span>
        <h2>
          FAQ
          <span className="hi">आपके सवाल</span>
        </h2>
      </div>
      <div className="bw-faq">
        {FAQS.map((f, i) => (
          <details key={f.q} className="bw-faq-item" open={i === 0}>
            <summary>
              <span>{f.q}</span>
              <span className="plus" aria-hidden="true">+</span>
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
