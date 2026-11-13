import type { PlayerView, Seat } from '@texas42/shared';
import { TopHud } from './TopHud.js';
import { TrickHistoryRail } from './TrickHistoryRail.js';
import { Seat as SeatView } from './Seat.js';
import { TrickArea } from './TrickArea.js';
import { Hand } from './Hand.js';
import { ShuffleDealOverlay } from './ShuffleDealOverlay.js';
import { CountFloatLayer } from './CountFloatLayer.js';
import { Overlays } from '../overlays/Overlays.js';
import { useUIStore } from '../../stores/uiStore.js';

const ACTION_PHASES = new Set(['bidding', 'trump', 'playing']);

export function Table({ view }: { view: PlayerView }): JSX.Element {
  const rejection = useUIStore((s) => s.rejection);
  const isActive = (seat: Seat): boolean => ACTION_PHASES.has(view.phase) && view.turn === seat;
  const dealing = view.phase === 'dealing';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 1280,
        height: 800,
        fontFamily: "'Libre Franklin',system-ui,sans-serif",
        backgroundColor: '#16352b',
        backgroundImage:
          'radial-gradient(ellipse 85% 75% at 50% 36%,#2c6450 0%,#1c4538 48%,#0e2620 100%)',
      }}
    >
      <TopHud view={view} />
      <TrickHistoryRail view={view} />

      {/* partner (top) */}
      <div style={{ position: 'absolute', top: 104, left: 507, transform: 'translateX(-50%)' }}>
        <SeatView seat={view.seats[2]} placement="top" active={isActive(2)} hidden={dealing} />
      </div>

      {/* left opponent */}
      <div style={{ position: 'absolute', left: 24, top: 312 }}>
        <SeatView seat={view.seats[1]} placement="left" active={isActive(1)} hidden={dealing} />
      </div>

      {/* right opponent */}
      <div style={{ position: 'absolute', left: 836, top: 312 }}>
        <SeatView seat={view.seats[3]} placement="right" active={isActive(3)} hidden={dealing} />
      </div>

      {/* center trick */}
      <div style={{ position: 'absolute', left: 507, top: 336, transform: 'translateX(-50%)' }}>
        <TrickArea view={view} />
      </div>

      {/* your hand */}
      <div style={{ position: 'absolute', left: 507, bottom: 18, transform: 'translateX(-50%)' }}>
        <Hand view={view} />
      </div>

      <CountFloatLayer />
      {dealing && <ShuffleDealOverlay handNo={view.handNo} />}

      {rejection && (
        <div
          className="absolute left-1/2 z-[70] -translate-x-1/2"
          style={{ bottom: 150, background: 'rgba(176,0,32,.92)', color: '#fff', font: "600 12px 'Libre Franklin'", padding: '8px 16px', borderRadius: 9 }}
          role="alert"
        >
          {rejection}
        </div>
      )}

      <Overlays view={view} />
    </div>
  );
}
