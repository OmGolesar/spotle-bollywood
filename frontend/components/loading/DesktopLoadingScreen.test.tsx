import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesktopLoadingScreen } from './DesktopLoadingScreen';

describe('DesktopLoadingScreen', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); cleanup(); });

  it('renders the bilingual word-mark', () => {
    render(<DesktopLoadingScreen onComplete={() => {}} />);
    expect(screen.getByText('बॉलीवुड स्पॉटल')).toBeTruthy();
  });

  it('calls onComplete after 1800ms', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1800); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete early on Escape key', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete early on Enter key', () => {
    const onComplete = vi.fn();
    render(<DesktopLoadingScreen onComplete={onComplete} />);
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not run fade-in animation when prefers-reduced-motion is set', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(prefers-reduced-motion: reduce)',
      media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const { container } = render(<DesktopLoadingScreen onComplete={() => {}} />);
    const title = container.querySelector('.loading-title');
    expect(title?.classList.contains('reduced-motion')).toBe(true);
    window.matchMedia = original;
  });
});
