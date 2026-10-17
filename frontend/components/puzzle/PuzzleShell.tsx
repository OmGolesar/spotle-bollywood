import "@/frontend/styles/puzzle.css";

type Props = {
  chrome?: "full" | "none";
  children: React.ReactNode;
};

export function PuzzleShell({ chrome = "full", children }: Props) {
  return (
    <div className={`bw-puzzle-shell chrome-${chrome}`}>
      <div className="bw-puzzle-grain" aria-hidden="true" />
      {children}
    </div>
  );
}
