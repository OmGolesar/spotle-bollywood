import { render, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BollywoodHero } from './BollywoodHero';

describe('BollywoodHero', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    expect((slides[0] as HTMLImageElement).src).toContain('title-logo');
  });

  it('starts with the first slide active and the rest aria-hidden', () => {
    const { container } = render(<BollywoodHero />);
    const slides = container.querySelectorAll('.bw-hero-logo img');
    expect(slides[0].classList.contains('is-active')).toBe(true);
    expect(slides[0].getAttribute('aria-hidden')).toBe('false');
    for (let i = 1; i < slides.length; i++) {
      expect(slides[i].classList.contains('is-active')).toBe(false);
      expect(slides[i].getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('advances to slide 2 after 5000ms', () => {
    const { container } = render(<BollywoodHero />);
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).toContain('poster-01-retro');
  });

  it('renders 6 dot indicators with exactly one active (after mount)', () => {
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
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).toContain('title-logo');
    expect(container.querySelectorAll('.bw-hero-dots').length).toBe(0);
  });

  it('skips a slide whose image errored out', () => {
    const { container } = render(<BollywoodHero />);
    const slide2 = container.querySelectorAll('.bw-hero-logo img')[1] as HTMLImageElement;
    act(() => { slide2.dispatchEvent(new Event('error')); });
    act(() => { vi.advanceTimersByTime(5000); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    expect(active.src).not.toContain('poster-01-retro');
    expect(active.src).toContain('poster-02-halftone');
  });

  it('in reduced-motion, if title-logo fails it falls through to the next slide', () => {
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
    const slide0 = container.querySelectorAll('.bw-hero-logo img')[0] as HTMLImageElement;
    act(() => { slide0.dispatchEvent(new Event('error')); });
    const active = container.querySelector('.bw-hero-logo img.is-active') as HTMLImageElement;
    // Should now show poster-01-retro rather than the broken title-logo.
    expect(active.src).toContain('poster-01-retro');
  });
});
