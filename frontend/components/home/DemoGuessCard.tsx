import '@/frontend/styles/bollywood-tokens.css';

export type DemoTileColor = 'teal' | 'mustard' | 'red';

export type DemoTile = {
  readonly label: string;
  readonly value: string;
  readonly color: DemoTileColor;
  readonly devIndex: string;
};

export type DemoGuessCardProps = {
  readonly title: string;
  readonly year: number;
  readonly director: string;
  readonly posterLabel: string;
  readonly posterBg: string;
  readonly tiles: ReadonlyArray<DemoTile>;
};

export function DemoGuessCard({
  title,
  year,
  director,
  posterLabel,
  posterBg,
  tiles,
}: DemoGuessCardProps) {
  return (
    <div className="bw-demo-guess">
      <div className="bw-demo-guess-head">
        <div className="bw-demo-poster" style={{ background: posterBg }}>
          {posterLabel}
        </div>
        <div className="bw-demo-info">
          <div className="t">{title}</div>
          <div className="s">
            {year} · {director}
          </div>
        </div>
      </div>
      <div className="bw-demo-tiles">
        {tiles.map((tile, i) => (
          <div key={i} className={`bw-demo-tile ${tile.color}`}>
            <span className="hi">{tile.devIndex}</span>
            <div className="label">{tile.label}</div>
            <div className="val">{tile.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
