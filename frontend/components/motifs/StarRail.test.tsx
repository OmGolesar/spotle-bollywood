import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StarRail } from './StarRail';

describe('StarRail', () => {
  afterEach(() => cleanup());

  it('renders N star spans when count is passed', () => {
    const { container } = render(<StarRail side="left" count={5} />);
    expect(container.querySelectorAll('.bw-star-rail > span').length).toBe(5);
  });

  it('defaults to 7 stars when count omitted', () => {
    const { container } = render(<StarRail side="right" />);
    expect(container.querySelectorAll('.bw-star-rail > span').length).toBe(7);
  });

  it('applies side-specific class', () => {
    const { container } = render(<StarRail side="right" />);
    expect(container.querySelector('.bw-star-rail')?.classList.contains('is-right')).toBe(true);
  });

  it('left side gets is-left class', () => {
    const { container } = render(<StarRail side="left" />);
    expect(container.querySelector('.bw-star-rail')?.classList.contains('is-left')).toBe(true);
  });
});
