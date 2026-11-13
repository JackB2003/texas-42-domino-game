import type { SeatView } from '@texas42/shared';
import { DominoTile } from './DominoTile.js';
import { Avatar } from './Avatar.js';
import { SEAT_VISUAL } from './seatVisuals.js';

type Placement = 'top' | 'left' | 'right';

function Fan({ count, w }: { count: number; w: number }): JSX.Element {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: count }, (_, i) => (
        <DominoTile key={i} top={0} bottom={0} w={w} faceDown ariaLabel="opponent tile" />
      ))}
    </div>
  );
}

function NameChip({ seat, active }: { seat: SeatView; active: boolean }): JSX.Element {
  const v = SEAT_VISUAL[seat.seat];
  const label = seat.seat === 2 ? 'Willie · partner' : seat.name;
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ background: v.chipBg, color: '#fff', font: "600 11px 'Libre Franklin'", padding: '2px 12px', borderRadius: 9 }}
    >
      {active && <span className="t42-thinking-dot" aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      <span>{label}</span>
    </div>
  );
}

/** A non-human seat: avatar, name chip, and a fan of face-down tiles. */
export function Seat({
  seat,
  placement,
  active,
  hidden = false,
}: {
  seat: SeatView;
  placement: Placement;
  active: boolean;
  hidden?: boolean;
}): JSX.Element {
  const count = hidden ? 0 : seat.handCount;
  if (placement === 'top') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-[11px]">
          <Avatar seat={seat.seat} active={active} />
          <Fan count={count} w={21} />
        </div>
        <NameChip seat={seat} active={active} />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Avatar seat={seat.seat} active={active} />
      <NameChip seat={seat} active={active} />
      <div className="mt-0.5">
        <Fan count={count} w={19} />
      </div>
      {!hidden && (
        <div style={{ color: '#cdbfa8', font: "600 9px 'Libre Franklin'" }}>{count} left</div>
      )}
    </div>
  );
}
