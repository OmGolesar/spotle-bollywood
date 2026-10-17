import Link from "next/link";
import { PuzzleShell } from "./PuzzleShell";
import "@/frontend/styles/puzzle.css";

type Variant = "loading" | "no_puzzle" | "backend_not_configured" | "other";

type Props = {
  variant: Variant;
  message?: string;
  onRetry?: () => void;
};

const COPY: Record<
  Variant,
  { title: string; devanagari: string; body: React.ReactNode }
> = {
  loading: {
    title: "Loading puzzle…",
    devanagari: "पहेली लोड हो रही है…",
    body: null,
  },
  no_puzzle: {
    title: "No puzzle today",
    devanagari: "आज का पहेली तैयार नहीं है",
    body: (
      <>
        Today&rsquo;s puzzle hasn&rsquo;t been scheduled yet. Try again after midnight
        IST, or run <code className="font-mono">npm run seed</code> in dev.
      </>
    ),
  },
  backend_not_configured: {
    title: "Backend not configured",
    devanagari: "बैकएंड सेटअप बाकी है",
    body: (
      <>
        Set up Supabase and run migrations +{" "}
        <code className="font-mono">npm run seed</code>. See{" "}
        <code className="font-mono">SETUP.md</code>.
      </>
    ),
  },
  other: {
    title: "Something went wrong",
    devanagari: "कुछ ग़लत हो गया",
    body: null,
  },
};

export function PuzzleErrorScreen({ variant, message, onRetry }: Props) {
  const copy = COPY[variant];
  return (
    <PuzzleShell chrome="none">
      <div className="bw-puzzle-error-card">
        <span className="corner tl" aria-hidden="true">★</span>
        <span className="corner tr" aria-hidden="true">★</span>
        <span className="corner bl" aria-hidden="true">★</span>
        <span className="corner br" aria-hidden="true">★</span>
        <h1 className="headline">
          {copy.title}
          <span className="hi" lang="hi">{copy.devanagari}</span>
        </h1>
        {(copy.body || message) && (
          <p className="body">
            {copy.body}
            {message && <span className="message"> {message}</span>}
          </p>
        )}
        {variant === "other" && onRetry && (
          <button type="button" onClick={onRetry} className="bw-puzzle-error-cta">
            Retry
          </button>
        )}
        {variant !== "loading" && variant !== "other" && (
          <Link href="/" className="bw-puzzle-error-cta">
            Back to home
          </Link>
        )}
      </div>
    </PuzzleShell>
  );
}
