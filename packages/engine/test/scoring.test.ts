import { describe, expect, it } from 'vitest';
import { ALL_DOMINOES, makeDomino, type HighBid, type Seat, type Trick } from '@texas42/shared';
import { scoreHand, trickPoints } from '../src/scoring.js';

const D = makeDomino;

/** Partition the real 28 dominoes into 7 tricks, all won by `winner`. */
function fullHand(winner: Seat): Trick[] {
  const tricks: Trick[] = [];
  for (let i = 0; i < 7; i++) {
    const tiles = ALL_DOMINOES.slice(i * 4, i * 4 + 4);
    const plays = tiles.map((domino, j) => ({ seat: j as Seat, domino }));
    tricks.push({ leader: 0, ledSuit: { kind: 'number', n: 6 }, plays, winner, points: trickPoints(plays) });
  }
  return tricks;
}

describe('trick points', () => {
  it('is 1 plus the count tiles in the trick', () => {
    const plays = [
      { seat: 0 as Seat, domino: D(6, 4) }, // 10 count
      { seat: 1 as Seat, domino: D(3, 2) }, // 5 count
      { seat: 2 as Seat, domino: D(6, 6) },
      { seat: 3 as Seat, domino: D(1, 0) },
    ];
    expect(trickPoints(plays)).toBe(1 + 10 + 5);
  });
});

describe('score hand', () => {
  it('makes a points bid when the team reaches its target', () => {
    const tricks = fullHand(0); // us (seats 0,2) win every trick -> 42 points.
    const winningBid: HighBid = { seat: 0, bid: { kind: 'points', points: 30 } };
    const result = scoreHand(winningBid, 'Sixes', tricks);
    expect(result.made).toBe(true);
    expect(result.winTeam).toBe('us');
    expect(result.marksAwarded).toBe(1);
    expect(result.points.us + result.points.them).toBe(42);
    expect(result.points.us).toBe(42);
  });

  it('sets a points bid when the team falls short', () => {
    const tricks = fullHand(1); // them (seats 1,3) win every trick.
    const winningBid: HighBid = { seat: 0, bid: { kind: 'points', points: 35 } };
    const result = scoreHand(winningBid, 'Sixes', tricks);
    expect(result.made).toBe(false);
    expect(result.winTeam).toBe('them');
    expect(result.marksAwarded).toBe(1);
  });

  it('requires sweeping all 42 points for a marks bid', () => {
    const sweep = fullHand(0);
    const bid: HighBid = { seat: 0, bid: { kind: 'marks', marks: 2 } };
    expect(scoreHand(bid, 'Sixes', sweep).made).toBe(true);
    expect(scoreHand(bid, 'Sixes', sweep).marksAwarded).toBe(2);

    const notSweep = fullHand(0);
    notSweep[6] = { ...notSweep[6]!, winner: 1 }; // opponents steal the last trick
    expect(scoreHand(bid, 'Sixes', notSweep).made).toBe(false);
  });
});
