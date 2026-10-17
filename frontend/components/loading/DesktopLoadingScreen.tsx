'use client';
import { useEffect, useRef, useState } from 'react';
import '@/frontend/styles/loading.css';

type Props = { onComplete: () => void };

export function DesktopLoadingScreen({ onComplete }: Props) {
  const doneRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const complete = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete();
    };

    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const timer = setTimeout(complete, 1800);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') complete();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onComplete]);

  return (
    <div className="loading-overlay ink" role="status" aria-live="polite" aria-label="Loading">
      <h1 className={`loading-title ${reducedMotion ? 'reduced-motion' : ''}`}>
        बॉलीवुड स्पॉटल
      </h1>
    </div>
  );
}
