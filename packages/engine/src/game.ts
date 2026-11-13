import {
  ALL_DOMINOES,
  bidRank,
  bidsEqual,
  bidTarget,
  dominoesEqual,
  MAX_POINTS_BID,
  MIN_BID,
  SEAT_TEAM,
  TOTAL_POINTS,
  TRUMP_OPTIONS,
  MARKS_TO_WIN,
  otherTeam,
  type Bid,
  type Domino,
  type GameAction,
  type GameState,
  type LegalActions,
  type Seat,
  type Trick,
} from '@texas42/shared';
import { mulberry32, shuffle } from './rng.js';
import { ledSuitOf, legalPlays, trickWinner } from './rules.js';
import { scoreHand, trickPoints } from './scoring.js';

export interface CreateGameOptions {
  seed?: number;
  dealer?: Seat;
}

export type ApplyResult = { ok: true; state: GameState } | { ok: false; reason: string };

const reject = (reason: string): ApplyResult => ({ ok: false, reason });
const accept = (state: GameState): ApplyResult => ({ ok: true, state });

function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 4) as Seat;
}

function emptyHands(): Record<Seat, Domino[]> {
  return { 0: [], 1: [], 2: [], 3: [] };
}

function emptyBids(): Record<Seat, Bid | null> {
  return { 0: null, 1: null, 2: null, 3: null };
}

/** Sort a hand for stable, readable display (descending). */
function sortHand(hand: Domino[]): Domino[] {
  return hand.slice().sort((a, b) => b.t * 7 + b.b - (a.t * 7 + a.b));
}

/**
 * Deal a fresh hand: shuffle deterministically, give 7 to each seat, and set up
 * the auction starting to the dealer's left.
 */
function dealHand(base: GameState): GameState {
  const rand = mulberry32(base.seed + base.handNo * 1000 + base.dealer);
  const shuffled = shuffle(ALL_DOMINOES, rand);
  const hands = emptyHands();
  shuffled.forEach((d, i) => {
    hands[(i % 4) as Seat].push(d);
  });
  for (const s of [0, 1, 2, 3] as Seat[]) hands[s] = sortHand(hands[s]);

  const firstBidder = nextSeat(base.dealer);
  const toBid: Seat[] = [];
  let s = firstBidder;
  for (let i = 0; i < 4; i++) {
    toBid.push(s);
    s = nextSeat(s);
  }

  return {
    ...base,
    phase: 'dealing',
    hands,
    bids: emptyBids(),
    highBid: null,
    winningBid: null,
    trump: null,
    trickNo: 0,
    currentTrick: null,
    completedTricks: [],
    handPoints: { us: 0, them: 0 },
    tricksWon: { us: 0, them: 0 },
    handResult: null,
    turn: firstBidder,
    toBid,
  };
}

/** Create a new game and deal the first hand (phase: dealing). */
export function createGame(opts: CreateGameOptions = {}): GameState {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const dealer = opts.dealer ?? 0;
  const base: GameState = {
    seed,
    phase: 'dealing',
    handNo: 1,
    dealer,
    turn: 0,
    hands: emptyHands(),
    bids: emptyBids(),
    highBid: null,
    winningBid: null,
    trump: null,
    trickNo: 0,
    currentTrick: null,
    completedTricks: [],
    handPoints: { us: 0, them: 0 },
    tricksWon: { us: 0, them: 0 },
    marks: { us: 0, them: 0 },
    handResult: null,
    toBid: [],
  };
  return dealHand(base);
}

/** Transition out of the (cosmetic) dealing phase into the auction. */
export function beginBidding(state: GameState): GameState {
  if (state.phase !== 'dealing') return state;
  return { ...state, phase: 'bidding' };
}

/** The bids a seat may legally place given the current high bid. */
export function legalBids(state: GameState): Bid[] {
  const bids: Bid[] = [];
  const highRank = state.highBid ? bidRank(state.highBid.bid) : MIN_BID - 1;
  for (let p = MIN_BID; p <= MAX_POINTS_BID; p++) {
    if (p > highRank) bids.push({ kind: 'points', points: p });
  }
  for (let m = 1; m <= 2; m++) {
    if (41 + m > highRank) bids.push({ kind: 'marks', marks: m });
  }
  return bids;
}

function isLegalBid(state: GameState, bid: Bid): boolean {
  if (bid.kind === 'pass') return true;
  return legalBids(state).some((b) => bidsEqual(b, bid));
}

/** The actions legal for a seat right now. Empty if it is not the seat's turn. */
export function legalActions(state: GameState, seat: Seat): LegalActions {
  const none: LegalActions = { bids: [], canPass: false, trumps: [], plays: [] };
  if (seat !== state.turn) return none;
  switch (state.phase) {
    case 'bidding':
      return { bids: legalBids(state), canPass: true, trumps: [], plays: [] };
    case 'trump':
      return { bids: [], canPass: false, trumps: TRUMP_OPTIONS.slice(), plays: [] };
    case 'playing': {
      const ledSuit = state.currentTrick?.ledSuit ?? null;
      return {
        bids: [],
        canPass: false,
        trumps: [],
        plays: legalPlays(state.hands[seat], ledSuit, state.trump),
      };
    }
    default:
      return none;
  }
}

function applyBid(state: GameState, seat: Seat, bid: Bid): ApplyResult {
  if (state.phase !== 'bidding') return reject('Not in the bidding phase.');
  if (seat !== state.turn) return reject('It is not your turn to bid.');
  if (!isLegalBid(state, bid)) return reject('That bid is not legal.');

  const bids = { ...state.bids, [seat]: bid };
  let highBid = state.highBid;
  if (bid.kind !== 'pass' && (!highBid || bidRank(bid) > bidRank(highBid.bid))) {
    highBid = { seat, bid };
  }
  const toBid = state.toBid.slice(1);

  if (toBid.length === 0) {
    if (!highBid) {
      // Everyone passed: rotate the dealer and redeal.
      return accept(dealHand({ ...state, dealer: nextSeat(state.dealer) }));
    }
    return accept({
      ...state,
      bids,
      highBid,
      winningBid: highBid,
      phase: 'trump',
      turn: highBid.seat,
      toBid: [],
    });
  }

  return accept({ ...state, bids, highBid, toBid, turn: toBid[0]! });
}

function applyTrump(state: GameState, seat: Seat, trump: GameState['trump']): ApplyResult {
  if (state.phase !== 'trump') return reject('Not in the trump phase.');
  if (!state.winningBid || seat !== state.winningBid.seat) {
    return reject('Only the bid winner declares trump.');
  }
  if (!trump || !TRUMP_OPTIONS.includes(trump)) return reject('Invalid trump.');

  const leader = state.winningBid.seat;
  const currentTrick: Trick = { leader, ledSuit: null, plays: [], winner: null, points: 0 };
  return accept({ ...state, trump, phase: 'playing', trickNo: 1, turn: leader, currentTrick });
}

/**
 * Whether the hand is mathematically decided given the points captured so far.
 * The bidding team needs `target` points to make their contract:
 *  - they have MADE it the moment their captured points reach the target;
 *  - they are SET the moment the opponents have captured enough that the
 *    bidding team can no longer reach the target (so the rest of the hand is
 *    pointless to play out).
 * Mark bids require sweeping all 42 points, so a single opponent point sets them.
 */
function handDecided(state: GameState): boolean {
  if (!state.winningBid) return false;
  const bidTeam = SEAT_TEAM[state.winningBid.seat];
  const oppTeam = otherTeam(bidTeam);
  const target = bidTarget(state.winningBid.bid);
  const bidTeamPoints = state.handPoints[bidTeam];
  const oppPoints = state.handPoints[oppTeam];

  // Mark bids: the bidding team must capture every point; any opponent point sets them.
  if (state.winningBid.bid.kind === 'marks') {
    return bidTeamPoints >= TOTAL_POINTS || oppPoints > 0;
  }

  // Points bids: made once the target is reached; set once it is unreachable.
  return bidTeamPoints >= target || TOTAL_POINTS - oppPoints < target;
}

function applyPlay(state: GameState, seat: Seat, domino: Domino): ApplyResult {
  if (state.phase !== 'playing' || !state.currentTrick) return reject('Not in the playing phase.');
  if (seat !== state.turn) return reject('It is not your turn to play.');

  const hand = state.hands[seat];
  if (!hand.some((d) => dominoesEqual(d, domino))) return reject('That tile is not in your hand.');

  const legal = legalPlays(hand, state.currentTrick.ledSuit, state.trump);
  if (!legal.some((d) => dominoesEqual(d, domino))) {
    return reject('You must follow suit.');
  }

  const hands = { ...state.hands, [seat]: hand.filter((d) => !dominoesEqual(d, domino)) };
  const ledSuit = state.currentTrick.ledSuit ?? ledSuitOf(domino, state.trump);
  const plays = [...state.currentTrick.plays, { seat, domino }];

  if (plays.length < 4) {
    return accept({
      ...state,
      hands,
      currentTrick: { ...state.currentTrick, ledSuit, plays },
      turn: nextSeat(seat),
    });
  }

  // Fourth tile played: resolve the trick.
  const winnerPlay = trickWinner(plays, state.trump);
  const points = trickPoints(plays);
  const resolved: Trick = {
    leader: state.currentTrick.leader,
    ledSuit,
    plays,
    winner: winnerPlay.seat,
    points,
  };
  const completedTricks = [...state.completedTricks, resolved];
  const winTeam = SEAT_TEAM[winnerPlay.seat];
  const handPoints = { ...state.handPoints, [winTeam]: state.handPoints[winTeam] + points };
  const tricksWon = { ...state.tricksWon, [winTeam]: state.tricksWon[winTeam] + 1 };

  // The hand ends either after the seventh trick or as soon as the outcome is
  // mathematically decided (the bidding team has made or been set on its bid).
  const afterTrickState: GameState = { ...state, completedTricks, handPoints, tricksWon };
  const lastTrick = state.trickNo >= 7;
  if (!lastTrick && !handDecided(afterTrickState)) {
    return accept({
      ...afterTrickState,
      hands,
      trickNo: state.trickNo + 1,
      turn: winnerPlay.seat,
      currentTrick: {
        leader: winnerPlay.seat,
        ledSuit: null,
        plays: [],
        winner: null,
        points: 0,
      },
    });
  }

  // Hand complete: score it and award marks.
  const handResult = scoreHand(state.winningBid!, state.trump!, completedTricks);
  const marks = {
    ...state.marks,
    [handResult.winTeam]: state.marks[handResult.winTeam] + handResult.marksAwarded,
  };
  const over = marks.us >= MARKS_TO_WIN || marks.them >= MARKS_TO_WIN;
  return accept({
    ...state,
    hands,
    completedTricks,
    handPoints,
    tricksWon,
    marks,
    handResult,
    currentTrick: null,
    phase: over ? 'gameOver' : 'handEnd',
  });
}

function applyReadyNextHand(state: GameState): ApplyResult {
  if (state.phase !== 'handEnd') return reject('No hand to advance from.');
  return accept(
    dealHand({
      ...state,
      dealer: nextSeat(state.dealer),
      handNo: state.handNo + 1,
    }),
  );
}

/** Apply a player intent. Rejects illegal actions without mutating state. */
export function applyAction(state: GameState, action: GameAction): ApplyResult {
  switch (action.type) {
    case 'PLACE_BID':
      return applyBid(state, action.seat, action.bid);
    case 'DECLARE_TRUMP':
      return applyTrump(state, action.seat, action.trump);
    case 'PLAY_DOMINO':
      return applyPlay(state, action.seat, action.domino);
    case 'READY_NEXT_HAND':
      return applyReadyNextHand(state);
  }
}
