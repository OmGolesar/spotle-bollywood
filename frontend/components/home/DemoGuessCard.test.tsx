import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { DemoGuessCard } from './DemoGuessCard';

const PARTIAL = {
  title: 'Lagaan',
  year: 2001,
  director: 'A. Gowariker',
  posterLabel: 'LAGAAN',
  posterBg: '#8b2b2b',
  tiles: [
    { label: 'Director', value: 'A. Gowariker', color: 'mustard', devIndex: '१' },
    { label: 'Cast', value: 'A. Khan', color: 'teal', devIndex: '२' },
    { label: 'Year ↓', value: '2001', color: 'red', devIndex: '३' },
    { label: 'Box office ↑', value: '₹65 cr', color: 'mustard', devIndex: '४' },
    { label: 'Music', value: 'A.R. Rahman', color: 'teal', devIndex: '५' },
    { label: 'Banner', value: 'Aamir Khan Pr.', color: 'red', devIndex: '६' },
    { label: 'Genre', value: 'Drama · Sport', color: 'mustard', devIndex: '७' },
    { label: 'IMDb ↓', value: '8.1', color: 'red', devIndex: '८' },
  ],
} as const;

describe('DemoGuessCard', () => {
  afterEach(() => cleanup());

  it('renders title, year, director', () => {
    render(<DemoGuessCard {...PARTIAL} />);
    expect(screen.getByText('Lagaan')).toBeTruthy();
    expect(screen.getByText(/2001 · A\. Gowariker/)).toBeTruthy();
  });

  it('renders 8 tiles each with its Devanagari numeral and value', () => {
    const { container } = render(<DemoGuessCard {...PARTIAL} />);
    const tiles = container.querySelectorAll('.bw-demo-tile');
    expect(tiles.length).toBe(8);
    expect(tiles[0].textContent).toContain('१');
    expect(tiles[0].textContent).toContain('A. Gowariker');
    expect(tiles[7].textContent).toContain('८');
    expect(tiles[7].textContent).toContain('8.1');
  });

  it('applies the correct color class per tile', () => {
    const { container } = render(<DemoGuessCard {...PARTIAL} />);
    const tiles = container.querySelectorAll('.bw-demo-tile');
    expect(tiles[0].classList.contains('mustard')).toBe(true);
    expect(tiles[1].classList.contains('teal')).toBe(true);
    expect(tiles[2].classList.contains('red')).toBe(true);
  });
});
