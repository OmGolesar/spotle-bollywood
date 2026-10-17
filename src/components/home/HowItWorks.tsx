import { DemoGuessCard } from "@/frontend/components/home/DemoGuessCard";
import { DEMO_PARTIAL_BW, DEMO_WIN_BW } from "./demoCardData";

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
    <div className="bw-step-head">
      <div className="num" aria-hidden="true">{index}</div>
      <div className="body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function SearchDemo() {
  return (
    <div className="bw-search-demo">
      <span className="icon" aria-hidden="true">🔍</span>
      <span className="q">Lagaan</span>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-label="How it works" className="bw-section">
      <div className="bw-section-head">
        <span className="eyebrow-stars">★ ★ ★</span>
        <h2>
          How it works
          <span className="hi">खेल कैसे चलता है</span>
        </h2>
      </div>

      <div className="bw-step-stack">
        <article className="bw-step-card">
          <StepHeader
            index="01"
            title="Pick any Hindi film"
            description={
              <>
                Search the catalogue and pick a title from the dropdown — Easy covers 500
                modern blockbusters, Medium 1,500 well-known hits, Hard the full 3,000+
                including parallel and cult cinema. Each guess reveals eight comparison tiles.
              </>
            }
          />
          <SearchDemo />
        </article>

        <article className="bw-step-card">
          <StepHeader
            index="02"
            title="Read the clues"
            description={
              <>
                Each tile shows how close your guess is.{" "}
                <span className="tag teal">TEAL</span> is exact,{" "}
                <span className="tag mustard">MUSTARD</span> is close,{" "}
                <span className="tag red">RED</span> is no match. Arrows on year, box office
                and IMDb say whether the answer is higher or lower.
              </>
            }
          />
        </article>
        <DemoGuessCard {...DEMO_PARTIAL_BW} />

        <article className="bw-step-card">
          <StepHeader
            index="03"
            title="Zero in on the answer"
            description={
              <>
                Use what each tile tells you to narrow down the next guess. Ten tries, total
                — and two hints unlocked after guesses 3 and 6 if you&rsquo;re stuck. When
                you nail the film every tile turns teal.
              </>
            }
          />
        </article>
        <DemoGuessCard {...DEMO_WIN_BW} />
      </div>
    </section>
  );
}
