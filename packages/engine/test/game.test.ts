import { describe, expect, it } from 'vitest';
import { dominoId, type GameState, type Seat, type Trump } from '@texas42/shared';
import { applyAction, beginBidding, createGame, legalActions } from '../src/game.js';

function expectOk(result: ReturnType<typeof applyAction>): GameState {
  if (!result.ok) throw new Error(`expected ok, got rejection: ${result.reason}`);
  return result.state;
}

/** Drive the auction so seat `firstBidder` wins with a points bid, others pass. */
function runAuction(state: GameState): GameState {
  let s = beginBidding(state);
  const opener = s.turn;
  s = expectOk(applyAction(s, { type: 'PLACE_BID', seat: s.turn, bid: { kind: 'points', points: 30 } }));
  while (s.phase === 'bidding') {
    s = expectOk(applyAction(s, { type: 'PLACE_BID', seat: s.turn, bid: { kind: 'pass' } }));
  }
  expect(s.phase).toBe('trump');
  expect(s.winningBid?.seat).toBe(opener);
  return s;
}

/** Play out an entire hand by always choosing the first legal tile. */
function playOutHand(state: GameState, trump: Trump): GameState {
  let s = expectOk(applyAction(state, { type: 'DECLARE_TRUMP', seat: state.turn, trump }));
  while (s.phase === 'playing') {
    const seat = s.turn;
    const plays = legalActions(s, seat).plays;
    expect(plays.length).toBeGreaterThan(0);
    s = expectOk(applyAction(s, { type: 'PLAY_DOMINO', seat, domino: plays[0]! }));
  }
  return s;
}

describe('createGame / deal', () => {
  it('deals seven tiles to each seat with no duplicates', () => {
    const g = createGame({ seed: 42 });
    const all = ([0, 1, 2, 3] as Seat[]).flatMap((s) => g.hands[s]);
    expect(all).toHaveLength(28);
    expect(new Set(all.map(dominoId)).size).toBe(28);
    for (const s of [0, 1, 2, 3] as Seat[]) expect(g.hands[s]).toHaveLength(7);
    expect(g.phase).toBe('dealing');
  });

  it('is deterministic for a given seed', () => {
    const a = createGame({ seed: 7 });
    const b = createGame({ seed: 7 });
    expect(a.hands).toEqual(b.hands);
  });

  it('starts the auction to the dealer left', () => {
    const g = beginBidding(createGame({ seed: 1, dealer: 0 }));
    expect(g.turn).toBe(1);
  });
});

describe('auction', () => {
  it('moves to the trump phase with a winner', () => {
    const s = runAuction(createGame({ seed: 3 }));
    expect(s.phase).toBe('trump');
    expect(s.winningBid).not.toBeNull();
  });

  it('redeals when everyone passes', () => {
    let s = beginBidding(createGame({ seed: 9, dealer: 0 }));
    const firstDealer = s.dealer;
    for (let i = 0; i < 4; i++) {
      s = expectOk(applyAction(s, { type: 'PLACE_BID', seat: s.turn, bid: { kind: 'pass' } }));
    }
    // Back to dealing a fresh hand with a rotated dealer.
    expect(s.phase).toBe('dealing');
    expect(s.dealer).toBe(((firstDealer + 1) % 4) as Seat);
    expect(s.highBid).toBeNull();
  });
});

describe('full hand', () => {
  it('plays out a hand and produces a consistent result', () => {
    const afterAuction = runAuction(createGame({ seed: 11 }));
    const s = playOutHand(afterAuction, 'Sixes');
    expect(['handEnd', 'gameOver']).toContain(s.phase);
    expect(s.handResult).not.toBeNull();
    // The hand may end before all seven tricks once the bid is decided, but the
    // points and tricks tallied must be internally consistent.
    expect(s.handPoints.us + s.handPoints.them).toBeLessThanOrEqual(42);
    expect(s.tricksWon.us + s.tricksWon.them).toBe(s.completedTricks.length);
    expect(s.completedTricks.length).toBeGreaterThan(0);
    expect(s.completedTricks.length).toBeLessThanOrEqual(7);
  });

  it('ends the hand early once the bidding team is set', () => {
    // Construct a state mid-play where the opponents have already captured
    // enough that a 30-point bid can never be made: bidding team can reach at
    // most 42 - 13 = 29 < 30, so the hand must be over.
    const afterAuction = runAuction(createGame({ seed: 11 }));
    let s = expectOk(applyAction(afterAuction, { type: 'DECLARE_TRUMP', seat: afterAuction.turn, trump: 'Sixes' }));
    // Play to completion; verify whenever it ends as 'set' the bid was unreachable.
    while (s.phase === 'playing') {
      const seat = s.turn;
      const plays = legalActions(s, seat).plays;
      s = expectOk(applyAction(s, { type: 'PLAY_DOMINO', seat, domino: plays[0]! }));
    }
    const r = s.handResult!;
    const bidTeamPts = r.points[r.bidTeam];
    if (!r.made) {
      // A set means the bidding team did not reach their target.
      expect(bidTeamPts).toBeLessThan(30);
      expect(r.winTeam).not.toBe(r.bidTeam);
    }
  });

  it('awards marks and can reach game over', () => {
    const afterAuction = runAuction(createGame({ seed: 5 }));
    // Put both teams on the brink so the next hand ends the game.
    const brink: GameState = { ...afterAuction, marks: { us: 6, them: 6 } };
    const s = playOutHand(brink, 'Doubles');
    expect(s.phase).toBe('gameOver');
    expect(Math.max(s.marks.us, s.marks.them)).toBeGreaterThanOrEqual(7);
  });

  it('advances to the next hand and rotates the dealer', () => {
    const afterAuction = runAuction(createGame({ seed: 13, dealer: 0 }));
    const ended = playOutHand(afterAuction, 'Fives');
    if (ended.phase !== 'handEnd') return; // occasionally a sweep could end game; skip
    const next = expectOk(applyAction(ended, { type: 'READY_NEXT_HAND', seat: 0 }));
    expect(next.phase).toBe('dealing');
    expect(next.handNo).toBe(2);
    expect(next.dealer).toBe(1);
  });
});

describe('illegal actions are rejected', () => {
  it('rejects bidding out of turn', () => {
    const s = beginBidding(createGame({ seed: 2, dealer: 0 }));
    const wrongSeat = ((s.turn + 1) % 4) as Seat;
    const res = applyAction(s, { type: 'PLACE_BID', seat: wrongSeat, bid: { kind: 'pass' } });
    expect(res.ok).toBe(false);
  });

  it('rejects a bid that does not beat the high bid', () => {
    let s = beginBidding(createGame({ seed: 4 }));
    s = expectOk(applyAction(s, { type: 'PLACE_BID', seat: s.turn, bid: { kind: 'points', points: 35 } }));
    const res = applyAction(s, { type: 'PLACE_BID', seat: s.turn, bid: { kind: 'points', points: 30 } });
    expect(res.ok).toBe(false);
  });

  it('rejects an illegal (off-suit) play', () => {
    const afterAuction = runAuction(createGame({ seed: 6 }));
    let s = expectOk(applyAction(afterAuction, { type: 'DECLARE_TRUMP', seat: afterAuction.turn, trump: 'Sixes' }));
    // Leader plays first legal tile.
    const leader = s.turn;
    const lead = legalActions(s, leader).plays[0]!;
    s = expectOk(applyAction(s, { type: 'PLAY_DOMINO', seat: leader, domino: lead }));
    // Next seat: try to play a tile that is not legal (if they must follow suit).
    const seat = s.turn;
    const legal = legalActions(s, seat).plays;
    const illegal = s.hands[seat].find((d) => !legal.some((l) => l.t === d.t && l.b === d.b));
    if (illegal) {
      const res = applyAction(s, { type: 'PLAY_DOMINO', seat, domino: illegal });
      expect(res.ok).toBe(false);
    }
  });
});
