import { describe, expect, it } from 'vitest';
import {
  ALL_DOMINOES,
  bidLabel,
  bidRank,
  countValue,
  dominoId,
  isCount,
  isTrumpTile,
  makeDomino,
} from '@texas42/shared';

describe('domino set', () => {
  it('contains 28 unique tiles', () => {
    expect(ALL_DOMINOES).toHaveLength(28);
    const ids = new Set(ALL_DOMINOES.map(dominoId));
    expect(ids.size).toBe(28);
  });

  it('stores tiles canonically (t >= b)', () => {
    for (const d of ALL_DOMINOES) expect(d.t).toBeGreaterThanOrEqual(d.b);
    expect(makeDomino(3, 5)).toEqual({ t: 5, b: 3 });
  });
});

describe('count tiles', () => {
  it('scores the five count dominoes correctly', () => {
    expect(countValue(makeDomino(5, 5))).toBe(10);
    expect(countValue(makeDomino(6, 4))).toBe(10);
    expect(countValue(makeDomino(5, 0))).toBe(5);
    expect(countValue(makeDomino(4, 1))).toBe(5);
    expect(countValue(makeDomino(3, 2))).toBe(5);
  });

  it('treats non-count tiles as zero', () => {
    expect(countValue(makeDomino(6, 6))).toBe(0);
    expect(countValue(makeDomino(6, 3))).toBe(0);
    expect(isCount(makeDomino(6, 6))).toBe(false);
    expect(isCount(makeDomino(5, 5))).toBe(true);
  });

  it('total count across all 28 tiles is 35', () => {
    const total = ALL_DOMINOES.reduce((sum, d) => sum + countValue(d), 0);
    expect(total).toBe(35);
  });
});

describe('trump detection', () => {
  it('handles number suits, doubles, and follow me', () => {
    expect(isTrumpTile(makeDomino(5, 2), 'Fives')).toBe(true);
    expect(isTrumpTile(makeDomino(6, 4), 'Fives')).toBe(false);
    expect(isTrumpTile(makeDomino(4, 4), 'Doubles')).toBe(true);
    expect(isTrumpTile(makeDomino(4, 3), 'Doubles')).toBe(false);
    expect(isTrumpTile(makeDomino(6, 6), 'Follow Me')).toBe(false);
    expect(isTrumpTile(makeDomino(0, 0), 'Blanks')).toBe(true);
  });
});

describe('bids', () => {
  it('ranks points below marks', () => {
    expect(bidRank({ kind: 'points', points: 41 })).toBe(41);
    expect(bidRank({ kind: 'marks', marks: 1 })).toBe(42);
    expect(bidRank({ kind: 'marks', marks: 2 })).toBe(43);
    expect(bidRank({ kind: 'pass' })).toBe(0);
  });

  it('labels bids the way the design does', () => {
    expect(bidLabel({ kind: 'points', points: 34 })).toBe('34');
    expect(bidLabel({ kind: 'marks', marks: 1 })).toBe('1 Mark');
    expect(bidLabel({ kind: 'marks', marks: 2 })).toBe('2 Marks');
  });
});
