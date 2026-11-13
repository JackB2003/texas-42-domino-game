import type { Seat } from '@texas42/shared';
import { useUIStore } from '../../stores/uiStore.js';

// Approximate table coordinates of each seat's played-tile slot.
const SEAT_POS: Record<Seat, { left: number; top: number }> = {
  0: { left: 507, top: 470 },
  1: { left: 430, top: 430 },
  2: { left: 507, top: 380 },
  3: { left: 585, top: 430 },
};

/** Renders "+5"/"+10" floats above the seat that just captured count tiles. */
export function CountFloatLayer(): JSX.Element {
  const floats = useUIStore((s) => s.countFloats);
  return (
    <div className="pointer-events-none absolute inset-0 z-[40]">
      {floats.map((f) => {
        const pos = SEAT_POS[f.seat];
        return (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              transform: 'translateX(-50%)',
              color: '#F5A623',
              font: "800 20px 'Libre Franklin'",
              textShadow: '0 2px 4px rgba(0,0,0,.6)',
              animation: 't42-count-float .6s ease-out forwards',
            }}
          >
            +{f.value}
          </div>
        );
      })}
    </div>
  );
}
