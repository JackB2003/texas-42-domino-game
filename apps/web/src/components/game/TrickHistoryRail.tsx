import { SEAT_NAMES, SEAT_TEAM, type PlayerView } from '@texas42/shared';
import { DominoTile } from './DominoTile.js';

const TEAM_COLOR = { us: '#3D6FB4', them: '#BF8F2A' } as const;

export function TrickHistoryRail({ view }: { view: PlayerView }): JSX.Element {
  return (
    <div
      className="absolute z-10 flex flex-col gap-[9px] p-3"
      style={{ top: 100, right: 14, bottom: 14, width: 240, background: 'rgba(0,0,0,.36)', borderRadius: 14, boxSizing: 'border-box' }}
    >
      <div className="flex items-center justify-between pb-[9px]" style={{ borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ color: '#e8d9bf', font: "700 11px 'Libre Franklin'", letterSpacing: 1.2 }}>TRICK HISTORY</div>
        <div style={{ color: '#9a8a72', font: "600 10px 'Libre Franklin'" }}>{view.completedTricks.length} / 7</div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {Array.from({ length: 7 }, (_, i) => {
          const trick = view.completedTricks[i];
          if (!trick || trick.winner === null) {
            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ border: '1.5px dashed rgba(255,255,255,.14)', borderRadius: 10, height: 40, color: '#6b5d49', font: "600 10px 'Libre Franklin'" }}
              >
                Trick {i + 1} · not played
              </div>
            );
          }
          const team = SEAT_TEAM[trick.winner];
          const color = TEAM_COLOR[team];
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,.05)', border: `1.5px solid ${color}`, borderRadius: 10, padding: '7px 9px' }}>
              <div className="mb-1.5 flex items-center justify-between">
                <span style={{ color: '#cdbfa8', font: "600 10px 'Libre Franklin'" }}>Trick {i + 1}</span>
                <span style={{ background: color, color: '#fff', font: "700 9px 'Libre Franklin'", padding: '1px 7px', borderRadius: 6 }}>
                  +{trick.points}
                </span>
              </div>
              <div className="flex items-end justify-center gap-[5px]" style={{ height: 42 }}>
                {trick.plays.map((p, j) => (
                  <DominoTile key={j} top={p.domino.t} bottom={p.domino.b} w={20} glow={p.seat === trick.winner ? color : ''} />
                ))}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-[5px]">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ color: '#9a8a72', font: "600 9px 'Libre Franklin'" }}>
                  {SEAT_NAMES[trick.winner]} won the trick
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
