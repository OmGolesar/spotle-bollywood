'use client';
import { useEffect, useRef, useState } from 'react';
import '@/frontend/styles/bollywood-tokens.css';

const POSTERS = [
  '/home/title-logo.png',
  '/home/poster-01-retro.png',
  '/home/poster-02-halftone.png',
  '/home/poster-03-rose.png',
  '/home/poster-04-matchbox.png',
  '/home/poster-05-devanagari.png',
] as const;

const INTERVAL_MS = 5000;

function nextIndex(current: number, failed: ReadonlySet<number>, length: number): number {
  for (let step = 1; step <= length; step++) {
    const candidate = (current + step) % length;
    if (!failed.has(candidate)) return candidate;
  }
  return current;
}

export function BollywoodHero() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const failedRef = useRef(failed);
  failedRef.current = failed;

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      setIdx((i) => nextIndex(i, failedRef.current, POSTERS.length));
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const markFailed = (i: number) => {
    setFailed((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  return (
    <>
      <div className="bw-hero-logo">
        {POSTERS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? 'Spotle Bollywood title' : `Spotle Bollywood poster ${i}`}
            className={i === idx ? 'is-active' : ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => markFailed(i)}
          />
        ))}
      </div>
      {!reducedMotion && (
        <div className="bw-hero-dots" aria-hidden="true">
          {POSTERS.map((_, i) => (
            <span key={i} className={i === idx ? 'dot is-active' : 'dot'} />
          ))}
        </div>
      )}
    </>
  );
}
