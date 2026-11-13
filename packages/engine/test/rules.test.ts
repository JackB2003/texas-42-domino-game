import { describe, expect, it } from 'vitest';
import { makeDomino, type PlayedDomino, type Seat } from '@texas42/shared';
import { ledSuitOf, legalPlays, tileInSuit, trickWinner } from '../src/rules.js';

const D = makeDomino;

function trick(tiles: [Seat, [number, number]][]): PlayedDomino[] {
  return tiles.map(([seat, [a, b]]) => ({ seat, domino: D(a, b) }));
}

describe('led suit', () => {
  it('is the higher end of a non-trump lead', () => {
    expect(ledSuitOf(D(6, 4), 'Fives')).toEqual({ kind: 'number', n: 6 });
  });
  it('is trump when the lead is a trump tile', () => {
    expect(ledSuitOf(D(5, 2), 'Fives')).toEqual({ kind: 'trump' });
  });
});

describe('following suit', () => {
  it('pulls trump tiles out of their natural number suit', () => {
    // Fives are trump, so 6-5 follows trump, not sixes.
    expect(tileInSuit(D(6, 5), { kind: 'number', n: 6 }, 'Fives')).toBe(false);
    expect(tileInSuit(D(6, 5), { kind: 'trump' }, 'Fives')).toBe(true);
    expect(tileInSuit(D(6, 4), { kind: 'number', n: 6 }, 'Fives')).toBe(true);
  });

  it('forces a follow when a matching suit tile is held', () => {
    const hand = [D(6, 4), D(5, 5), D(3, 2)];
    const legal = legalPlays(hand, { kind: 'number', n: 6 }, 'Fives');
    expect(legal).toEqual([D(6, 4)]);
  });

  it('allows any tile when the suit cannot be followed', () => {
    const hand = [D(5, 5), D(3, 2)]; // both trump / off-suit for sixes
    const legal = legalPlays(hand, { kind: 'number', n: 6 }, 'Fives');
    expect(legal).toHaveLength(2);
  });

  it('lets the leader play anything', () => {
    const hand = [D(6, 4), D(3, 2)];
    expect(legalPlays(hand, null, 'Fives')).toHaveLength(2);
  });
});

describe('trick winner', () => {
  it('awards the trick to the highest trump played', () => {
    const plays = trick([
      [0, [6, 4]],
      [1, [6, 2]],
      [2, [5, 0]], // only trump (fives)
      [3, [3, 1]],
    ]);
    expect(trickWinner(plays, 'Fives').seat).toBe(2);
  });

  it('ranks the natural double as the highest of its suit', () => {
    const plays = trick([
      [0, [6, 4]],
      [1, [6, 6]], // double of led suit
      [2, [3, 2]],
      [3, [6, 1]],
    ]);
    expect(trickWinner(plays, 'Fives').seat).toBe(1);
  });

  it('handles Doubles-as-trump', () => {
    const plays = trick([
      [0, [6, 5]],
      [1, [4, 4]], // trump (double)
      [2, [6, 3]],
      [3, [2, 2]], // trump (double), lower
    ]);
    expect(trickWinner(plays, 'Doubles').seat).toBe(1);
  });

  it('handles Follow Me (no trump): highest of led suit wins', () => {
    const plays = trick([
      [0, [5, 5]], // double of led suit fives
      [1, [6, 5]],
      [2, [5, 0]],
      [3, [1, 0]], // off-suit
    ]);
    expect(trickWinner(plays, 'Follow Me').seat).toBe(0);
  });

  it('off-suit non-trump tiles cannot win', () => {
    const plays = trick([
      [0, [6, 4]], // led sixes
      [1, [2, 1]],
      [2, [3, 0]],
      [3, [6, 1]],
    ]);
    // No trump tiles among these for Twos? 2-1 is trump (twos). So winner is 2-1.
    expect(trickWinner(plays, 'Twos').seat).toBe(1);
  });
});
