import { type GameState, type Seat, type Trick } from '@texas42/shared';
import { tileInSuit } from '@texas42/engine';

/**
 * Public information: which number suits each seat is known to be void in,
 * inferred from play. If a seat failed to follow the led suit, they hold none
 * of it. Only number suits are tracked (trump voids are situational).
 */
export type VoidMap = Record<Seat, Set<number>>;

function emptyVoids(): VoidMap {
  return { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };
}

function scanTrick(trick: Trick, trump: GameState['trump'], voids: VoidMap): void {
  const led = trick.ledSuit;
  if (!led || led.kind !== 'number') return;
  for (const play of trick.plays) {
    if (play.seat === trick.leader) continue;
    if (!tileInSuit(play.domino, led, trump)) {
      voids[play.seat].add(led.n);
    }
  }
}

/** Build the void map from all completed and in-progress tricks. */
export function trackVoids(state: GameState): VoidMap {
  const voids = emptyVoids();
  for (const trick of state.completedTricks) scanTrick(trick, state.trump, voids);
  if (state.currentTrick && state.currentTrick.plays.length > 0) {
    scanTrick(state.currentTrick as Trick, state.trump, voids);
  }
  return voids;
}
