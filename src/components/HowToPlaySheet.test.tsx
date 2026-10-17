import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { HowToPlaySheet } from './HowToPlaySheet';

describe('HowToPlaySheet trigger', () => {
  afterEach(() => cleanup());

  it('applies triggerClassName to the opener button when provided', () => {
    render(<HowToPlaySheet triggerClassName="bw-pill-outline-ink" />);
    const btn = screen.getByRole('button', { name: /How to play/i });
    expect(btn.classList.contains('bw-pill-outline-ink')).toBe(true);
  });

  it('uses the default className when triggerClassName omitted', () => {
    render(<HowToPlaySheet />);
    const btn = screen.getByRole('button', { name: /How to play/i });
    expect(btn.classList.contains('bw-pill-outline-ink')).toBe(false);
    expect(btn.className.length).toBeGreaterThan(0);
  });
});
