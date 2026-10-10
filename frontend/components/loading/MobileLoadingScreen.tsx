'use client';
import { useEffect, useRef } from 'react';
import '@/frontend/styles/loading.css';

type Props = { onComplete: () => void };

export function MobileLoadingScreen({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const complete = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete();
    };

    const timer = setTimeout(complete, 7000);
    const v = videoRef.current;
    if (v) {
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => complete());
      }
    }
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handle = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  return (
    <video
      ref={videoRef}
      className="loading-video"
      src="/loading/mobile-loading.mp4"
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-label="Loading"
      role="status"
      onEnded={handle}
      onError={handle}
    />
  );
}
