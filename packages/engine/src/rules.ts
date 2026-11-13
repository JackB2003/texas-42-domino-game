import {
  isDouble,
  isTrumpTile,
  TRUMP_SUIT_NUMBER,
  type Domino,
  type LedSuit,
  type PlayedDomino,
  type Trump,
} from '@texas42/shared';

/**
 * The suit a led domino establishes.
 * - A trump tile leads the trump suit.
 * - Otherwise the suit is the tile's higher end (its larger pip).
 */
export function ledSuitOf(domino: Domino, trump: Trump | null): LedSuit {
  if (isTrumpTile(domino, trump)) return { kind: 'trump' };
  return { kind: 'number', n: Math.max(domino.t, domino.b) };
}

/**
 * Whether a tile belongs to a suit for the purposes of following.
 * Trump tiles are pulled out of their natural number suit and into trump.
 */
export function tileInSuit(tile: Domino, suit: LedSuit, trump: Trump | null): boolean {
  if (suit.kind === 'trump') return isTrumpTile(tile, trump);
  if (isTrumpTile(tile, trump)) return false;
  return tile.t === suit.n || tile.b === suit.n;
}

/**
 * Legal plays given the current hand and the suit led this trick.
 * If `ledSuit` is null the player is leading and may play anything.
 * Otherwise they must follow suit if they hold any tile of it.
 */
export function legalPlays(
  hand: readonly Domino[],
  ledSuit: LedSuit | null,
  trump: Trump | null,
): Domino[] {
  if (!ledSuit) return hand.slice();
  const following = hand.filter((tile) => tileInSuit(tile, ledSuit, trump));
  return following.length > 0 ? following : hand.slice();
}

/**
 * Rank of a trump tile within the trump suit (higher wins). The double of the
 * suit is highest; for number trumps the rest rank by their non-trump end.
 */
export function trumpRank(tile: Domino, trump: Trump): number {
  if (trump === 'Doubles') return tile.t; // among doubles, 6-6 high down to 0-0
  const n = TRUMP_SUIT_NUMBER[trump];
  if (n === null) return -1;
  if (isDouble(tile)) return 7; // the natural double is the highest trump
  return tile.t === n ? tile.b : tile.t;
}

/** Rank of a tile within a number suit (higher wins). Double is highest. */
function suitRank(tile: Domino, n: number): number {
  if (isDouble(tile)) return 7;
  return tile.t === n ? tile.b : tile.t;
}

/**
 * Determine the winning seat of a completed (4-play) trick. The first play
 * establishes the led suit. Trump beats non-trump; otherwise the highest tile
 * of the led suit wins.
 */
export function trickWinner(plays: readonly PlayedDomino[], trump: Trump | null): PlayedDomino {
  const lead = plays[0];
  if (!lead) throw new Error('trickWinner: empty trick');
  const led = ledSuitOf(lead.domino, trump);

  const trumpPlays = plays.filter((p) => isTrumpTile(p.domino, trump));
  if (trump && trumpPlays.length > 0) {
    return trumpPlays.reduce((best, p) =>
      trumpRank(p.domino, trump) > trumpRank(best.domino, trump) ? p : best,
    );
  }

  if (led.kind === 'number') {
    const ledN = led.n;
    const inSuit = plays.filter((p) => tileInSuit(p.domino, led, trump));
    return inSuit.reduce((best, p) =>
      suitRank(p.domino, ledN) > suitRank(best.domino, ledN) ? p : best,
    );
  }

  // Led suit was trump but no trump declared (shouldn't happen) -> first play wins.
  return lead;
}
