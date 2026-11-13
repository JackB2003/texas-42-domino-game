import type { PlayerView } from '@texas42/shared';
import { Modal } from './Modal.js';
import { useSocketStore } from '../../stores/socketStore.js';

export function GameOverOverlay({ view }: { view: PlayerView }): JSX.Element {
  const newGame = useSocketStore((s) => s.newGame);
  const winnerUs = view.marks.us >= view.marks.them;
  const color = winnerUs ? '#3D6FB4' : '#BF8F2A';
  const label = winnerUs ? 'Your team' : 'Other team';

  return (
    <Modal width={520} dim="rgba(8,20,15,.85)" borderColor={color} labelledBy="game-over-title">
      <div className="text-center" style={{ padding: '10px 2px' }}>
        <div style={{ font: "400 15px 'Rye',serif", color: '#E8a06a', letterSpacing: 2 }}>JB Texas 42</div>
        <div id="game-over-title" style={{ font: "800 44px 'Libre Franklin'", color: '#fff', margin: '10px 0 2px' }}>
          Game Over
        </div>
        <div style={{ font: "800 26px 'Libre Franklin'", color, marginBottom: 8 }}>{label} win</div>
        <div style={{ color: '#cdbfa8', font: "600 16px 'Libre Franklin'", marginBottom: 26 }}>
          Final marks {view.marks.us} – {view.marks.them}
        </div>
        <button type="button" className="t42-primary-btn w-full" style={{ padding: 15, font: "700 16px 'Libre Franklin'" }} onClick={() => void newGame()}>
          New game
        </button>
      </div>
    </Modal>
  );
}
