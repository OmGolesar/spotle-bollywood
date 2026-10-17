'use client';
import Image from 'next/image';
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

function firstNonFailed(failed: ReadonlySet<number>, length: number): number {
  for (let i = 0; i < length; i++) {
    if (!failed.has(i)) return i;
  }
  return 0;
}

export function BollywoodHero() {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const failedRef = useRef(failed);
  failedRef.current = failed;

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const timer = setInterval(() => {
      setIdx((i) => nextIndex(i, failedRef.current, POSTERS.length));
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mounted, reducedMotion]);

  const markFailed = (i: number) => {
    setFailed((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  // In reduced-motion mode, derive the display slide from the failed set so a
  // 404 on title-logo still falls through to the next non-failed poster.
  const displayIdx = reducedMotion ? firstNonFailed(failed, POSTERS.length) : idx;
  const showDots = mounted && !reducedMotion;

  return (
    <>
      <div className="bw-hero-logo">
        {POSTERS.map((src, i) => {
          const active = i === displayIdx;
          return (
            <Image
              key={src}
              src={src}
              alt={active ? 'Spotle Bollywood' : ''}
              fill
              sizes="(max-width: 720px) 85vw, 400px"
              priority={i === 0}
              className={active ? 'is-active' : ''}
              aria-hidden={!active}
              onError={() => markFailed(i)}
            />
          );
        })}
      </div>
      {showDots && (
        <div className="bw-hero-dots" aria-hidden="true">
          {POSTERS.map((_, i) => (
            <span key={i} className={i === idx ? 'dot is-active' : 'dot'} />
          ))}
        </div>
      )}
    </>
  );
}
