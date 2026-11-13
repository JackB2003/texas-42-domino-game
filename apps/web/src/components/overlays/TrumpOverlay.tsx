import { bidLabel, type PlayerView } from '@texas42/shared';
import { Modal } from './Modal.js';
import { useSocketStore } from '../../stores/socketStore.js';

export function TrumpOverlay({ view }: { view: PlayerView }): JSX.Element {
  const declareTrump = useSocketStore((s) => s.declareTrump);
  const bid = view.winningBid?.bid;

  return (
    <Modal width={560} labelledBy="trump-title">
      <div style={{ font: "400 13px 'Rye',serif", color: '#E8a06a', letterSpacing: 1 }}>
        You won the bid with {bid ? bidLabel(bid) : '—'}
      </div>
      <div id="trump-title" style={{ font: "700 26px 'Libre Franklin'", color: '#fff', margin: '2px 0 20px' }}>
        Declare trump
      </div>
      <div className="flex flex-wrap gap-[9px]">
        {view.yourLegalTrumps.map((trump) => (
          <button
            key={trump}
            type="button"
            className="t42-bid-btn"
            style={{ minWidth: 78, padding: '12px 14px' }}
            onClick={() => declareTrump(trump)}
          >
            {trump}
          </button>
        ))}
      </div>
    </Modal>
  );
}
