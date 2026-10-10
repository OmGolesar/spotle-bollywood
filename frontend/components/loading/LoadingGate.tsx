'use client';
import { useEffect, useState } from 'react';
import { DesktopLoadingScreen } from './DesktopLoadingScreen';
import { MobileLoadingScreen } from './MobileLoadingScreen';

const SESSION_KEY = 'spb_loaded_v1';

type Props = { children: React.ReactNode };

type Mode = 'checking' | 'mobile' | 'desktop' | 'done';

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
function writeFlag(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* graceful degradation */
  }
}

export function LoadingGate({ children }: Props) {
  const [mode, setMode] = useState<Mode>('checking');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (readFlag()) {
      setMode('done');
      return;
    }
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    setMode(isMobile ? 'mobile' : 'desktop');
  }, []);

  const handleComplete = () => {
    setLeaving(true);
    writeFlag();
    setTimeout(() => setMode('done'), 350);
  };

  return (
    <>
      {children}
      {mode === 'desktop' && (
        <div className={leaving ? 'loading-overlay-wrap is-leaving' : 'loading-overlay-wrap'}>
          <DesktopLoadingScreen onComplete={handleComplete} />
        </div>
      )}
      {mode === 'mobile' && (
        <div className={leaving ? 'loading-overlay-wrap is-leaving' : 'loading-overlay-wrap'}>
          <MobileLoadingScreen onComplete={handleComplete} />
        </div>
      )}
    </>
  );
}
