import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadingGate } from './LoadingGate';

const setViewport = (isMobile: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: q === '(max-width: 768px)' ? isMobile : false,
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

describe('LoadingGate', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setViewport(false);
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
    cleanup();
  });

  it('always renders children (so SSR hydration shows the hero underneath)', () => {
    render(
      <LoadingGate>
        <div>hero</div>
      </LoadingGate>,
    );
    expect(screen.getByText('hero')).toBeTruthy();
  });

  it('renders the desktop loading overlay when viewport is wide', () => {
    setViewport(false);
    render(
      <LoadingGate>
        <div>hero</div>
      </LoadingGate>,
    );
    expect(screen.getByText('बॉलीवुड स्पॉटल')).toBeTruthy();
  });

  it('renders the mobile video overlay when viewport is narrow', () => {
    setViewport(true);
    render(
      <LoadingGate>
        <div>hero</div>
      </LoadingGate>,
    );
    const video = screen.queryByLabelText('Loading');
    expect(video?.tagName).toBe('VIDEO');
  });

  it('skips the overlay when session flag is already set', () => {
    sessionStorage.setItem('spb_loaded_v1', '1');
    render(
      <LoadingGate>
        <div>hero</div>
      </LoadingGate>,
    );
    expect(screen.queryByText('बॉलीवुड स्पॉटल')).toBeNull();
    expect(screen.queryByLabelText('Loading')).toBeNull();
  });

  it('sets the session flag after the overlay completes', () => {
    vi.useFakeTimers();
    render(
      <LoadingGate>
        <div>hero</div>
      </LoadingGate>,
    );
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(sessionStorage.getItem('spb_loaded_v1')).toBe('1');
  });

  it('does not crash if sessionStorage throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('blocked');
    });
    expect(() =>
      render(
        <LoadingGate>
          <div>hero</div>
        </LoadingGate>,
      ),
    ).not.toThrow();
    Storage.prototype.getItem = original;
  });
});
