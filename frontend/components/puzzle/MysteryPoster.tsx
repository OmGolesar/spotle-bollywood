import "@/frontend/styles/puzzle.css";

type Props = {
  posterUrl: string | null;
  blurPx: number;
  alt: string;
};

export function MysteryPoster({ posterUrl, blurPx, alt }: Props) {
  return (
    <div className="bw-mystery-poster">
      <span className="corner tl" aria-hidden="true">★</span>
      <span className="corner tr" aria-hidden="true">★</span>
      <span className="corner bl" aria-hidden="true">★</span>
      <span className="corner br" aria-hidden="true">★</span>
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={alt}
          style={{ filter: `blur(${blurPx}px)`, transition: "filter 400ms ease-out" }}
        />
      ) : (
        <div className="bw-poster-fallback" role="img" aria-label={alt}>
          <svg viewBox="0 0 24 36" width="42" height="56" aria-hidden="true">
            <rect x="2" y="2" width="20" height="32" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 7h2M4 12h2M4 17h2M4 22h2M4 27h2M18 7h2M18 12h2M18 17h2M18 22h2M18 27h2" stroke="currentColor" strokeWidth="1" />
            <circle cx="12" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  );
}
