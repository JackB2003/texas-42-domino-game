import { useEffect, useRef } from 'react';
import { bidLabel, type PlayerView } from '@texas42/shared';
import { Modal } from './Modal.js';
import { useSocketStore } from '../../stores/socketStore.js';

const AUTO_ADVANCE_MS = 3000;

export function HandCompleteOverlay({ view }: { view: PlayerView }): JSX.Element | null {
  const readyNextHand = useSocketStore((s) => s.readyNextHand);
  const advanced = useRef(false);
  const result = view.handResult;

  const advance = (): void => {
    if (advanced.current) return;
    advanced.current = true;
    readyNextHand();
  };

  useEffect(() => {
    const t = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, []);

  if (!result) return null;

  const color = result.made ? '#46C97E' : '#FF6A5E';
  const verdict = result.made ? 'BID MADE' : 'SET';
  const bidTeamLabel = result.bidTeam === 'us' ? 'Your team' : 'Other team';
  const winLabel = result.winTeam === 'us' ? 'your team' : 'the other team';
  const plural = result.marksAwarded > 1 ? 's' : '';

  return (
    <Modal width={560} dim="rgba(8,20,15,.78)" borderColor={color} labelledBy="hand-complete-title">
      <div className="text-center">
        <div style={{ font: "400 13px 'Rye',serif", color: '#E8a06a', letterSpacing: 1 }}>
          Hand {view.handNo} complete
        </div>
        <div id="hand-complete-title" style={{ font: "800 38px 'Libre Franklin'", color, margin: '8px 0 4px', letterSpacing: 1 }}>
          {verdict}
        </div>
        <div style={{ color: '#cdbfa8', font: "500 14px 'Libre Franklin'", marginBottom: 22 }}>
          {bidTeamLabel} bid {bidLabel(result.bid)} on {result.trump} — scored {result.points[result.bidTeam]}
        </div>

        <div className="mb-[22px] flex gap-3.5">
          <div className="flex-1" style={{ background: 'rgba(61,111,180,.14)', border: '1px solid rgba(61,111,180,.4)', borderRadius: 12, padding: 14 }}>
            <div style={{ color: '#79A6E2', font: "600 10px 'Libre Franklin'", letterSpacing: 1 }}>YOUR TEAM</div>
            <div style={{ color: '#fff', font: "800 30px 'Libre Franklin'" }}>{result.points.us}</div>
          </div>
          <div className="flex-1" style={{ background: 'rgba(212,162,53,.14)', border: '1px solid rgba(212,162,53,.4)', borderRadius: 12, padding: 14 }}>
            <div style={{ color: '#E6C566', font: "600 10px 'Libre Franklin'", letterSpacing: 1 }}>OTHER TEAM</div>
            <div style={{ color: '#fff', font: "800 30px 'Libre Franklin'" }}>{result.points.them}</div>
          </div>
        </div>

        <div style={{ color: '#e8d9bf', font: "600 14px 'Libre Franklin'", marginBottom: 22 }}>
          +{result.marksAwarded} mark{plural} to <span style={{ color }}>{winLabel}</span> · now {view.marks.us}–{view.marks.them}
        </div>

        <button type="button" className="t42-primary-btn w-full" style={{ padding: 14, font: "700 15px 'Libre Franklin'" }} onClick={advance}>
          Deal next hand →
        </button>
      </div>
    </Modal>
  );
}
