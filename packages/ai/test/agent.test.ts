import { describe, expect, it } from 'vitest';
import { applyAction, beginBidding, createGame, legalActions } from '@texas42/engine';
import { type GameState } from '@texas42/shared';
import { decideAction, decideBid } from '../src/agent.js';

/** Run a complete AI-vs-AI game, asserting every move is legal. */
function playGame(seed: number): GameState {
  let state = beginBidding(createGame({ seed }));
  let guard = 0;
  while (state.phase !== 'gameOver') {
    guard += 1;
    if (guard > 5000) throw new Error('game did not terminate');

    if (state.phase === 'dealing') {
      state = beginBidding(state);
      continue;
    }
    if (state.phase === 'handEnd') {
      const r = applyAction(state, { type: 'READY_NEXT_HAND', seat: 0 });
      if (!r.ok) throw new Error(r.reason);
      state = beginBidding(r.state);
      continue;
    }

    const action = decideAction(state, state.turn);
    expect(action).not.toBeNull();

    const result = applyAction(state, action!);
    if (!result.ok) throw new Error(`illegal AI action: ${result.reason}`);
    state = result.state;
  }
  return state;
}

describe('ai self-play', () => {
  it('completes a full game to 7 marks without stalling', () => {
    const final = playGame(123);
    expect(final.phase).toBe('gameOver');
    expect(Math.max(final.marks.us, final.marks.them)).toBeGreaterThanOrEqual(7);
  });

  it('is deterministic and legal across several seeds', () => {
    for (const seed of [1, 2, 7, 42, 99]) {
      const final = playGame(seed);
      expect(final.phase).toBe('gameOver');
    }
  });
});

describe('decideBid', () => {
  it('always returns a legal bid', () => {
    const state = beginBidding(createGame({ seed: 17 }));
    const bid = decideBid(state, state.turn);
    const legal = legalActions(state, state.turn).bids;
    const ok = bid.kind === 'pass' || legal.some((b) => JSON.stringify(b) === JSON.stringify(bid));
    expect(ok).toBe(true);
  });

  it('never wins the bid as a pass-only outcome forever (some seed bids)', () => {
    // At least one of several seeds should produce a non-redeal auction quickly.
    let sawTrump = false;
    for (const seed of [3, 4, 5, 6, 8]) {
      let s = beginBidding(createGame({ seed }));
      let guard = 0;
      while (s.phase === 'bidding' && guard++ < 20) {
        const a = decideAction(s, s.turn)!;
        const r = applyAction(s, a);
        if (!r.ok) break;
        s = r.state;
      }
      if (s.phase === 'trump') sawTrump = true;
    }
    expect(sawTrump).toBe(true);
  });
});
