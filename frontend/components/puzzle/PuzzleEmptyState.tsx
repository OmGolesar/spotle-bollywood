import "@/frontend/styles/puzzle.css";

export function PuzzleEmptyState() {
  return (
    <p className="bw-puzzle-empty-helper">
      <span aria-hidden="true" className="star">★</span>
      {" "}Pick any film. Each guess reveals comparison tiles and un-blurs the poster.
      <span className="hi" lang="hi"> कोई भी फ़िल्म चुनिए</span>
    </p>
  );
}
