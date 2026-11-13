import type { Seat } from '@texas42/shared';
import { SEAT_VISUAL } from './seatVisuals.js';

/** Round player avatar with an active-turn ring. */
export function Avatar({ seat, active }: { seat: Seat; active: boolean }): JSX.Element {
  const v = SEAT_VISUAL[seat];
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: v.avatar,
        height: v.avatar,
        borderRadius: '50%',
        background: v.gradient,
        border: `3px solid ${v.border}`,
        boxShadow: active
          ? `0 3px 7px rgba(0,0,0,.5), 0 0 0 3px ${v.border}, 0 0 14px ${v.border}`
          : '0 3px 7px rgba(0,0,0,.5)',
        color: seat === 0 || seat === 2 ? '#2a1606' : '#fff',
        font: "700 17px 'Libre Franklin'",
        transition: 'box-shadow .25s ease',
      }}
    >
      {v.initials}
    </div>
  );
}
