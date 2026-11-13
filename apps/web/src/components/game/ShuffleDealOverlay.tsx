import { DominoTile } from './DominoTile.js';

const PILE = [
  { rot: '-9deg', off: '-3px,1px' },
  { rot: '-4deg', off: '-1px,-1px' },
  { rot: '0deg', off: '0px,0px' },
  { rot: '5deg', off: '1px,1px' },
  { rot: '9deg', off: '3px,-1px' },
];

// Per-seat landing offsets from the center origin (design-authoritative).
const SEAT_OFFSET = [
  { dx: '35px', dy: '285px' }, // you (bottom)
  { dx: '-455px', dy: '-25px' }, // left opponent
  { dx: '30px', dy: '-300px' }, // partner (top)
  { dx: '355px', dy: '-25px' }, // right opponent
];

function dealTiles(): { dx: string; dy: string; delay: string }[] {
  const tiles: { dx: string; dy: string; delay: string }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let k = 0; k < 4; k++) {
      const i = r * 4 + k;
      const seat = SEAT_OFFSET[k]!;
      tiles.push({ dx: seat.dx, dy: seat.dy, delay: `${(0.95 + i * 0.045).toFixed(2)}s` });
    }
  }
  return tiles;
}

/** The ~2.7s shuffle-and-deal sequence shown at the start of every hand. */
export function ShuffleDealOverlay({ handNo }: { handNo: number }): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 z-[55] flex items-center justify-center">
      {/* shuffling pile */}
      <div
        style={{ position: 'absolute', left: 507, top: 435, transform: 'translate(-50%,-50%)', animation: 't42-pile-out .4s ease 1.15s both' }}
      >
        <div style={{ position: 'relative', width: 46, height: 88, animation: 't42-shuffle .24s ease-in-out 5 alternate' }}>
          {PILE.map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, top: 0, transform: `rotate(${p.rot}) translate(${p.off})` }}>
              <DominoTile top={0} bottom={0} w={46} faceDown />
            </div>
          ))}
        </div>
      </div>

      {/* tiles dealt to seats */}
      {dealTiles().map((d, i) => (
        <div
          key={i}
          style={
            {
              position: 'absolute',
              left: 507,
              top: 435,
              margin: '-44px 0 0 -23px',
              '--dx': d.dx,
              '--dy': d.dy,
              animation: `t42-deal-out .5s cubic-bezier(.3,.65,.3,1) ${d.delay} both`,
            } as React.CSSProperties
          }
        >
          <DominoTile top={0} bottom={0} w={46} faceDown />
        </div>
      ))}

      <div
        style={{ position: 'absolute', top: 150, left: 507, transform: 'translateX(-50%)', background: 'rgba(0,0,0,.55)', borderRadius: 9, padding: '6px 18px', color: '#e8d9bf', font: "700 13px 'Libre Franklin'", letterSpacing: 1.5 }}
      >
        Shuffling &amp; dealing hand {handNo}
      </div>
    </div>
  );
}
