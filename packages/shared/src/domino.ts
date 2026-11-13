import { TRUMP_SUIT_NUMBER } from './constants.js';
import type { Bid, Domino, Pip, Trump } from './types.js';

/** Build a domino in canonical orientation (larger pip is `t`). */
export function makeDomino(a: Pip, b: Pip): Domino {
  return a >= b ? { t: a, b } : { t: b, b: a };
}

/** Stable string id for a domino, e.g. "6-4". */
export function dominoId(d: Domino): string {
  return `${d.t}-${d.b}`;
}

export function dominoesEqual(a: Domino, b: Domino): boolean {
  return a.t === b.t && a.b === b.b;
}

export function isDouble(d: Domino): boolean {
  return d.t === d.b;
}

/** The full set of 28 unique dominoes (0-0 through 6-6), canonical orientation. */
export const ALL_DOMINOES: readonly Domino[] = (() => {
  const all: Domino[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = 0; b <= a; b++) {
      all.push({ t: a, b });
    }
  }
  return all;
})();

/**
 * Count value of a domino: the 5 "count" tiles are worth 5 or 10 points
 * (5-0, 4-1, 3-2 = 5; 6-4, 5-5 = 10). All others are worth 0.
 */
export function countValue(d: Domino): number {
  const sum = d.t + d.b;
  return sum === 5 || sum === 10 ? sum : 0;
}

export function isCount(d: Domino): boolean {
  return countValue(d) > 0;
}

/**
 * Whether a tile is a trump under the given declaration.
 * - Doubles: every double is trump.
 * - Follow Me: nothing is trump.
 * - A number suit: any tile containing that number is trump.
 */
export function isTrumpTile(d: Domino, trump: Trump | null): boolean {
  if (!trump) return false;
  if (trump === 'Follow Me') return false;
  if (trump === 'Doubles') return isDouble(d);
  const n = TRUMP_SUIT_NUMBER[trump];
  return n !== null && (d.t === n || d.b === n);
}

/** A numeric ranking for comparing bids (higher beats lower). */
export function bidRank(bid: Bid): number {
  switch (bid.kind) {
    case 'pass':
      return 0;
    case 'points':
      return bid.points;
    case 'marks':
      // A 1-mark bid is equivalent to bidding 42, so it ranks just above 41.
      return 41 + bid.marks;
  }
}

export function bidsEqual(a: Bid, b: Bid): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'points' && b.kind === 'points') return a.points === b.points;
  if (a.kind === 'marks' && b.kind === 'marks') return a.marks === b.marks;
  return a.kind === 'pass' && b.kind === 'pass';
}

/** Human-readable bid label, matching the design (e.g. "34", "1 Mark"). */
export function bidLabel(bid: Bid): string {
  switch (bid.kind) {
    case 'pass':
      return 'Pass';
    case 'points':
      return String(bid.points);
    case 'marks':
      return bid.marks === 1 ? '1 Mark' : `${bid.marks} Marks`;
  }
}

/** Points the bidding team must capture to make the contract. */
export function bidTarget(bid: Bid): number {
  switch (bid.kind) {
    case 'pass':
      return 0;
    case 'points':
      return bid.points;
    case 'marks':
      // Mark bids require capturing all 42 points.
      return 42;
  }
}

/** Marks awarded for making (or conceding, on a set) the contract. */
export function bidMarks(bid: Bid): number {
  switch (bid.kind) {
    case 'pass':
      return 0;
    case 'points':
      return 1;
    case 'marks':
      return bid.marks;
  }
}
