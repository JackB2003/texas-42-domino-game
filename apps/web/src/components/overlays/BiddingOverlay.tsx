import { bidLabel, SEAT_NAMES, type PlayerView, type Seat } from '@texas42/shared';
import { Modal } from './Modal.js';
import { useSocketStore } from '../../stores/socketStore.js';

const OTHER_SEATS: Seat[] = [1, 2, 3];

export function BiddingOverlay({ view }: { view: PlayerView }): JSX.Element {
  const placeBid = useSocketStore((s) => s.placeBid);
  const beat = view.highBid ? bidLabel(view.highBid.bid) : '30';

  return (
    <Modal width={600} labelledBy="bidding-title">
      <div style={{ font: "400 13px 'Rye',serif", color: '#E8a06a', letterSpacing: 1 }}>
        Hand {view.handNo}
      </div>
      <div id="bidding-title" style={{ font: "700 26px 'Libre Franklin'", color: '#fff', margin: '2px 0 18px' }}>
        Bidding
      </div>

      <div className="mb-[22px] flex gap-[9px]">
        {OTHER_SEATS.map((seat) => {
          const bid = view.seats[seat].bid;
          const label = bid ? bidLabel(bid) : '—';
          const placed = bid && bid.kind !== 'pass';
          return (
            <div
              key={seat}
              className="flex-1 text-center"
              style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${placed ? 'rgba(61,111,180,.6)' : 'rgba(255,255,255,.12)'}`, borderRadius: 10, padding: '9px 10px' }}
            >
              <div style={{ color: '#cdbfa8', font: "600 10px 'Libre Franklin'" }}>{SEAT_NAMES[seat]}</div>
              <div style={{ color: placed ? '#AECBEE' : '#9a8a72', font: "800 16px 'Libre Franklin'", marginTop: 3 }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ color: '#e8d9bf', font: "600 11px 'Libre Franklin'", letterSpacing: 1, marginBottom: 10 }}>
        YOUR BID · must beat {beat}
      </div>
      <div className="flex flex-wrap gap-2">
        {view.yourLegalBids.map((bid) => (
          <button
            key={bidLabel(bid)}
            type="button"
            className="t42-bid-btn"
            style={{ minWidth: 54, padding: '10px 12px' }}
            onClick={() => placeBid(bid)}
          >
            {bidLabel(bid)}
          </button>
        ))}
      </div>

      {view.yourCanPass && (
        <button
          type="button"
          className="t42-pass-btn mt-4 w-full"
          style={{ padding: 11 }}
          onClick={() => placeBid({ kind: 'pass' })}
        >
          Pass
        </button>
      )}
    </Modal>
  );
}
