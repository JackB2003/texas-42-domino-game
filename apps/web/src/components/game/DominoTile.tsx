import type { CSSProperties } from 'react';

/** Pip colors — the standard double-six scheme (design-authoritative). */
const PIP_COLOR: Record<number, string> = {
  0: '',
  1: '#3FA0E0',
  2: '#2E8B57',
  3: '#CB3B33',
  4: '#8A5A2B',
  5: '#1E3A8A',
  6: '#E0A800',
};

/** Which of the nine 3x3 cells are "on" for each pip count. */
const PIP_PATTERN: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const BASE_SHADOW = '0 3px 5px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.7)';

export interface DominoTileProps {
  top: number;
  bottom: number;
  /** Width in px; height is derived as round(w * 1.92). */
  w?: number;
  faceDown?: boolean;
  /** When set, draws a colored halo (gold for trump, team color in the rail). */
  glow?: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

function Half({ pip, dotPx, padPx }: { pip: number; dotPx: number; padPx: number }): JSX.Element {
  const on = new Set(PIP_PATTERN[pip] ?? []);
  const color = PIP_COLOR[pip] ?? '';
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gridTemplateRows: 'repeat(3,1fr)',
        padding: padPx,
        boxSizing: 'border-box',
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {on.has(i) && (
            <div
              style={{
                width: dotPx,
                height: dotPx,
                borderRadius: '50%',
                background: color,
                boxShadow: 'inset 0 -1px 1.5px rgba(0,0,0,.35)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** A single domino tile rendered with CSS, matching the design spec exactly. */
export function DominoTile({
  top,
  bottom,
  w = 58,
  faceDown = false,
  glow,
  className,
  style,
  ariaLabel,
}: DominoTileProps): JSX.Element {
  const width = w;
  const height = Math.round(w * 1.92);
  const dotPx = Math.max(3, Math.round(w * 0.155));
  const padPx = Math.round(w * 0.11);
  const shadow = glow ? `${BASE_SHADOW}, 0 0 0 3px ${glow}, 0 0 16px ${glow}` : BASE_SHADOW;

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaLabel ?? (faceDown ? 'face-down domino' : `domino ${top}-${bottom}`)}
      style={{
        width,
        height,
        borderRadius: 9,
        background: 'linear-gradient(160deg,#FBF7EA,#ECE2C8)',
        boxShadow: shadow,
        border: '1px solid rgba(120,100,60,.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {faceDown ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '72%',
              height: '84%',
              borderRadius: 5,
              background: 'linear-gradient(160deg,#F1E9D2,#E0D3B2)',
              boxShadow:
                'inset 0 1px 2px rgba(255,255,255,.65),inset 0 -1px 2px rgba(120,100,60,.3)',
            }}
          />
        </div>
      ) : (
        <>
          <Half pip={top} dotPx={dotPx} padPx={padPx} />
          <div
            style={{ height: 2, background: 'rgba(95,72,40,.4)', margin: '0 11%', borderRadius: 2 }}
          />
          <Half pip={bottom} dotPx={dotPx} padPx={padPx} />
        </>
      )}
    </div>
  );
}
