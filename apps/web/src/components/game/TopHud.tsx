import { bidLabel, SEAT_NAMES, type PlayerView } from '@texas42/shared';

function MarksCard({
  label,
  marks,
  variant,
}: {
  label: string;
  marks: number;
  variant: 'us' | 'them';
}): JSX.Element {
  const bg =
    variant === 'us'
      ? 'linear-gradient(180deg,#5A89CE,#3D6FB4)'
      : 'linear-gradient(180deg,#D4A235,#BF8F2A)';
  const labelColor = variant === 'us' ? '#ffe6d2' : '#d6f6f7';
  return (
    <div
      style={{ background: bg, borderRadius: 11, padding: '8px 13px', minWidth: 124, boxShadow: '0 3px 7px rgba(0,0,0,.3)' }}
    >
      <div className="flex items-baseline justify-between">
        <span style={{ color: labelColor, font: "600 9px 'Libre Franklin'", letterSpacing: 1 }}>
          {label}
        </span>
        <span style={{ font: "800 20px 'Libre Franklin'", color: '#fff', lineHeight: 1 }}>
          {marks}
          <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 600 }}>/7</span>
        </span>
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="t42-mark-seg"
            style={{
              flex: 1,
              height: 9,
              borderRadius: 5,
              background: i < marks ? '#fff' : 'rgba(255,255,255,.28)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function TopHud({ view }: { view: PlayerView }): JSX.Element {
  const counted = view.handPoints.us + view.handPoints.them;
  const usPct = counted > 0 ? `${Math.round((view.handPoints.us / counted) * 100)}%` : '50%';
  const bid = view.winningBid?.bid ?? view.highBid?.bid ?? null;
  const wonBy = view.winningBid ? SEAT_NAMES[view.winningBid.seat] : view.highBid ? SEAT_NAMES[view.highBid.seat] : '—';

  return (
    <div
      className="absolute inset-x-0 top-0 z-20 flex items-center gap-3.5 px-[22px]"
      style={{ height: 86, background: 'linear-gradient(180deg,#0d1a15,#070f0b)', borderBottom: '2px solid rgba(61,111,180,.4)' }}
    >
      <div className="flex items-center gap-[11px]">
        <div
          className="flex items-center justify-center"
          style={{ width: 58, height: 58, borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,#5A89CE,#3D6FB4)', boxShadow: '0 4px 10px rgba(0,0,0,.5)' }}
        >
          <span style={{ font: "400 20px 'Rye',serif", color: '#F4E9D6', textShadow: '1.5px 1.5px 0 #234A82', lineHeight: 1 }}>
            JB
          </span>
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ font: "400 16px 'Rye',serif", color: '#fff' }}>JB</div>
          <div style={{ font: "700 9px 'Libre Franklin'", color: '#E8a06a', letterSpacing: 2 }}>TEXAS 42</div>
        </div>
      </div>

      <div className="flex-1" />

      <MarksCard label="YOUR TEAM" marks={view.marks.us} variant="us" />
      <MarksCard label="OTHER TEAM" marks={view.marks.them} variant="them" />

      <div style={{ minWidth: 236 }}>
        <div className="flex justify-between" style={{ color: '#e8d9bf', font: "600 9px 'Libre Franklin'", letterSpacing: 1 }}>
          <span>HAND POINTS</span>
          <span style={{ opacity: 0.7 }}>{counted} OF 42</span>
        </div>
        <div className="mt-1.5 flex overflow-hidden" style={{ height: 20, borderRadius: 7, background: '#000' }}>
          <div
            className="flex items-center"
            style={{ width: usPct, background: '#3D6FB4', paddingLeft: 10, color: '#fff', font: "800 13px 'Libre Franklin'", minWidth: 26 }}
          >
            {view.handPoints.us}
          </div>
          <div
            className="flex flex-1 items-center justify-end"
            style={{ background: '#BF8F2A', paddingRight: 10, color: '#fff', font: "800 13px 'Libre Franklin'" }}
          >
            {view.handPoints.them}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-[15px]"
        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(61,111,180,.5)', borderRadius: 11, padding: '7px 15px' }}
      >
        <div>
          <div style={{ color: '#9a8a72', font: "600 8px 'Libre Franklin'", letterSpacing: 1 }}>BID</div>
          <div style={{ color: '#79A6E2', font: "800 19px 'Libre Franklin'", lineHeight: 1 }}>
            {bid ? bidLabel(bid) : '—'}
          </div>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.12)' }} />
        <div>
          <div style={{ color: '#9a8a72', font: "600 8px 'Libre Franklin'", letterSpacing: 1 }}>TRUMP</div>
          <div style={{ color: '#e8d9bf', font: "700 13px 'Libre Franklin'" }}>{view.trump ?? '—'}</div>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.12)' }} />
        <div>
          <div style={{ color: '#9a8a72', font: "600 8px 'Libre Franklin'", letterSpacing: 1 }}>WON BY</div>
          <div style={{ color: '#e8d9bf', font: "700 13px 'Libre Franklin'" }}>{wonBy}</div>
        </div>
      </div>
    </div>
  );
}
