import { render, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BollywoodHero } from './BollywoodHero';

describe('BollywoodHero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default matchMedia: no reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: false,
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders 6 poster slides with the title-logo as the first', () => {
    const { container } = render(<BollywoodHero />);
    const slides = container.querySelectorAll('.bw-hero-logo img');
    expect(slides.length).toBe(6);
    expect((slides[0] as HTMLImageElement).src).toContain('/home/title-logo.png');
  });

  it('starts with the first slide active', () => {
    const { container } = render(<BollywoodHero />);
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active).toBeTruthy();
    expect(active.src).toContain('/home/title-logo.png');
  });

  it('advances to slide 2 after 5000ms', () => {
    const { container } = render(<BollywoodHero />);
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).toContain('/home/poster-01-retro.png');
  });

  it('renders 6 dot indicators with exactly one active', () => {
    const { container } = render(<BollywoodHero />);
    expect(container.querySelectorAll('.bw-hero-dots .dot').length).toBe(6);
    expect(container.querySelectorAll('.bw-hero-dots .dot.is-active').length).toBe(1);
  });

  it('respects prefers-reduced-motion — no cycle, no dots', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: q === '(prefers-reduced-motion: reduce)',
        media: q, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {},
        addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
      }),
    });
    const { container } = render(<BollywoodHero />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(container.querySelector('.bw-hero-logo img.is-active')?.getAttribute('src'))
      .toContain('/home/title-logo.png');
    expect(container.querySelectorAll('.bw-hero-dots').length).toBe(0);
  });

  it('skips a slide whose image errored out', () => {
    const { container } = render(<BollywoodHero />);
    const slide2 = container.querySelectorAll('.bw-hero-logo img')[1] as HTMLImageElement;
    act(() => { slide2.dispatchEvent(new Event('error')); });
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).not.toContain('/home/poster-01-retro.png');
    // Should be slide 3 (poster-02-halftone)
    expect(active.src).toContain('/home/poster-02-halftone.png');
  });
});
