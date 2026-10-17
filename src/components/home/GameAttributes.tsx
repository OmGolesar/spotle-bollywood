const ATTRS = [
  { n: "01", label: "Director", desc: "Who helmed the film." },
  { n: "02", label: "Lead cast", desc: "Top three billed actors." },
  { n: "03", label: "Year", desc: "Theatrical release year." },
  { n: "04", label: "Box office", desc: "Lifetime India gross in ₹ crore." },
  { n: "05", label: "Music", desc: "Composer or music director." },
  { n: "06", label: "Banner", desc: "Primary production company." },
  { n: "07", label: "Genre", desc: "Up to two primary genres." },
  { n: "08", label: "IMDb score", desc: "Audience rating out of 10." },
] as const;

export function GameAttributes() {
  return (
    <section aria-label="Game attributes" className="bw-section">
      <div className="bw-section-head">
        <span className="eyebrow-stars">★ WHAT THE EIGHT TILES MEAN ★</span>
        <h2>
          Every tile tells a story
          <span className="hi">आठ संकेत · एक फ़िल्म</span>
        </h2>
      </div>
      <div className="bw-attr-grid">
        {ATTRS.map((a) => (
          <div key={a.n} className="bw-attr-card">
            <div className="n">{a.n}</div>
            <div className="label">{a.label}</div>
            <div className="desc">{a.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
