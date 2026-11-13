import {
  bidRank,
  countValue,
  isCount,
  isDouble,
  isTrumpTile,
  SEAT_TEAM,
  TRUMP_OPTIONS,
  TRUMP_SUIT_NUMBER,
  type Bid,
  type Domino,
  type GameAction,
  type GameState,
  type Seat,
  type Trump,
} from '@texas42/shared';
import { ledSuitOf, legalActions, legalPlays, trickWinner, trumpRank } from '@texas42/engine';
import { trackVoids } from './voids.js';

/** Number suits the AI considers when bidding (Follow Me is never bid blind). */
const NUMBER_TRUMPS: Trump[] = ['Blanks', 'Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes'];

/** Heuristic strength of a hand if `trump` were declared. */
function suitScore(hand: readonly Domino[], trump: Trump): number {
  let trumpCount = 0;
  let countTiles = 0;
  let hasDouble = false;
  for (const d of hand) {
    if (isTrumpTile(d, trump)) {
      trumpCount += 1;
      if (isCount(d)) countTiles += 1;
      if (isDouble(d)) hasDouble = true;
    }
  }
  return trumpCount * 3 + countTiles * 2 + (hasDouble ? 4 : 0);
}

function bestSuit(hand: readonly Domino[]): { trump: Trump; score: number } {
  let best = { trump: 'Sixes' as Trump, score: -1 };
  for (const trump of [...NUMBER_TRUMPS, 'Doubles' as Trump]) {
    const score = suitScore(hand, trump);
    if (score > best.score) best = { trump, score };
  }
  return best;
}

/** Decide a bid for the seat: bid up to an estimate, otherwise pass. */
export function decideBid(state: GameState, seat: Seat): Bid {
  const hand = state.hands[seat];
  const { bids, canPass } = legalActions(state, seat);
  if (bids.length === 0) return { kind: 'pass' };

  const { score } = bestSuit(hand);
  if (score < 11) return canPass ? { kind: 'pass' } : bids[0]!;

  // Map strength to a desired contract: ~30 for a marginal hand up to a mark.
  const desiredPoints = 30 + Math.round((score - 11) * 0.6);
  const desiredRank = Math.min(desiredPoints, 42);

  // Pick the highest legal bid that does not exceed the desired strength.
  const affordable = bids.filter((b) => bidRank(b) <= desiredRank);
  if (affordable.length === 0) return canPass ? { kind: 'pass' } : bids[0]!;
  return affordable.reduce((hi, b) => (bidRank(b) > bidRank(hi) ? b : hi));
}

/** Pick the strongest trump suit, preferring one where we hold the double. */
export function decideTrump(state: GameState, seat: Seat): Trump {
  const hand = state.hands[seat];
  let best: { trump: Trump; score: number } = { trump: 'Follow Me', score: -1 };
  for (const trump of TRUMP_OPTIONS) {
    if (trump === 'Follow Me') continue;
    let tiles = 0;
    let hasDouble = false;
    for (const d of hand) {
      if (isTrumpTile(d, trump)) {
        tiles += 1;
        if (isDouble(d)) hasDouble = true;
      }
    }
    const score = tiles * 2 + (hasDouble ? 3 : 0);
    if (score > best.score) best = { trump, score };
  }
  // A genuinely trump-less hand declares Follow Me.
  return best.score <= 2 ? 'Follow Me' : best.trump;
}

function trumpsOutstanding(state: GameState, seat: Seat, trump: Trump): number {
  const n = TRUMP_SUIT_NUMBER[trump];
  const total = trump === 'Follow Me' ? 0 : 7; // 7 tiles per number suit, 7 doubles
  if (total === 0 && n === null) return 0;
  let seen = 0;
  const scan = (d: Domino) => {
    if (isTrumpTile(d, trump)) seen += 1;
  };
  for (const t of state.completedTricks) for (const p of t.plays) scan(p.domino);
  if (state.currentTrick) for (const p of state.currentTrick.plays) scan(p.domino);
  const mine = state.hands[seat].filter((d) => isTrumpTile(d, trump)).length;
  return Math.max(0, total - seen - mine);
}

function cheapest(tiles: readonly Domino[]): Domino {
  return tiles.reduce((lo, d) =>
    countValue(d) < countValue(lo) || (countValue(d) === countValue(lo) && d.t + d.b < lo.t + lo.b)
      ? d
      : lo,
  );
}

function richestCount(tiles: readonly Domino[]): Domino | null {
  const counts = tiles.filter(isCount);
  if (counts.length === 0) return null;
  return counts.reduce((hi, d) => (countValue(d) > countValue(hi) ? d : hi));
}

function chooseLead(state: GameState, seat: Seat, options: readonly Domino[]): Domino {
  const trump = state.trump;
  const onBidTeam = state.winningBid && SEAT_TEAM[state.winningBid.seat] === SEAT_TEAM[seat];
  const trumps = trump ? options.filter((d) => isTrumpTile(d, trump)) : [];

  // Declarer pulls trumps while opponents still hold them.
  if (onBidTeam && trump && trumps.length > 0 && trumpsOutstanding(state, seat, trump) > 0) {
    return trumps.reduce((hi, d) => (trumpRank(d, trump) > trumpRank(hi, trump) ? d : hi));
  }

  // Otherwise lead a high, low-count non-trump if possible.
  const offTrump = trump ? options.filter((d) => !isTrumpTile(d, trump)) : options.slice();
  const pool = offTrump.length > 0 ? offTrump : options;
  const nonCount = pool.filter((d) => !isCount(d));
  const finalPool = nonCount.length > 0 ? nonCount : pool;
  return finalPool.reduce((hi, d) => (d.t + d.b > hi.t + hi.b ? d : hi));
}

/** Decide which domino to play (lead or follow). */
export function decidePlay(state: GameState, seat: Seat): Domino {
  const trump = state.trump;
  const trick = state.currentTrick;
  const ledSuit = trick?.ledSuit ?? null;
  const options = legalPlays(state.hands[seat], ledSuit, trump);
  if (options.length === 1) return options[0]!;
  if (!trick || trick.plays.length === 0) return chooseLead(state, seat, options);

  void trackVoids(state); // public read; informs future tuning

  const winnerSoFar = trickWinner(trick.plays, trump).seat;
  const partnerWinning = SEAT_TEAM[winnerSoFar] === SEAT_TEAM[seat];

  if (partnerWinning) {
    // Pile our count onto a trick we are taking; else shed the cheapest tile.
    return richestCount(options) ?? cheapest(options);
  }

  // Opponent leads: try to win, ideally capturing count.
  const winners = options.filter(
    (d) => trickWinner([...trick.plays, { seat, domino: d }], trump).seat === seat,
  );
  if (winners.length > 0) {
    const trickHasCount = trick.plays.some((p) => isCount(p.domino));
    if (trickHasCount) {
      // Win as cheaply as possible to preserve high tiles.
      return cheapest(winners);
    }
    return cheapest(winners);
  }

  // Cannot win: throw off the cheapest non-count tile.
  return cheapest(options);
}

/** Pick the appropriate action for the seat given the current phase. */
export function decideAction(state: GameState, seat: Seat): GameAction | null {
  if (state.turn !== seat) return null;
  switch (state.phase) {
    case 'bidding':
      return { type: 'PLACE_BID', seat, bid: decideBid(state, seat) };
    case 'trump':
      return { type: 'DECLARE_TRUMP', seat, trump: decideTrump(state, seat) };
    case 'playing':
      return { type: 'PLAY_DOMINO', seat, domino: decidePlay(state, seat) };
    default:
      return null;
  }
}

export { ledSuitOf };
