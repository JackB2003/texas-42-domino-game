import type { PlayerView } from '@texas42/shared';
import { BiddingOverlay } from './BiddingOverlay.js';
import { TrumpOverlay } from './TrumpOverlay.js';
import { HandCompleteOverlay } from './HandCompleteOverlay.js';
import { GameOverOverlay } from './GameOverOverlay.js';

/** Chooses which phase overlay to render on top of the table. */
export function Overlays({ view }: { view: PlayerView }): JSX.Element | null {
  if (view.phase === 'gameOver') return <GameOverOverlay view={view} />;
  if (view.phase === 'handEnd') return <HandCompleteOverlay view={view} />;
  if (view.phase === 'bidding' && view.turn === 0) return <BiddingOverlay view={view} />;
  if (view.phase === 'trump' && view.turn === 0) return <TrumpOverlay view={view} />;
  return null;
}
