import '@/frontend/styles/bollywood-tokens.css';

type Props = { side: 'left' | 'right'; count?: number };

export function StarRail({ side, count = 7 }: Props) {
  const stars = Array.from({ length: count }, (_, i) => i);
  return (
    <aside aria-hidden className={`bw-star-rail is-${side}`}>
      {stars.map((i) => (
        <span key={i}>★</span>
      ))}
    </aside>
  );
}
