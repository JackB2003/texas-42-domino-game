/**
 * Core Texas 42 domain types. Shared between the engine, AI, server, and web client.
 */

/** A pip value on one half of a domino: 0 (blank) through 6. */
export type Pip = number;

/**
 * A domino tile. Stored canonically with `t >= b` so two tiles are equal iff
 * their fields are equal. `t` is the larger end (rendered on top), `b` the smaller.
 */
export interface Domino {
  t: Pip;
  b: Pip;
}

/** Seats around the table, clockwise from the human. */
export type Seat = 0 | 1 | 2 | 3;

/** The two partnerships. `us` = seats 0 + 2, `them` = seats 1 + 3. */
export type Team = 'us' | 'them';

/** The nine trump declarations available after winning the bid. */
export type Trump =
  | 'Blanks'
  | 'Ones'
  | 'Twos'
  | 'Threes'
  | 'Fours'
  | 'Fives'
  | 'Sixes'
  | 'Doubles'
  | 'Follow Me';

/**
 * A bid. Either a pass, a points contract (30-41 points of the 42 available),
 * or a marks contract (1+ marks, requires capturing all 42 points).
 */
export type Bid =
  | { kind: 'pass' }
  | { kind: 'points'; points: number }
  | { kind: 'marks'; marks: number };

/** The lifecycle phases of a hand. */
export type Phase = 'dealing' | 'bidding' | 'trump' | 'playing' | 'handEnd' | 'gameOver';

/** A domino played into a trick by a seat. */
export interface PlayedDomino {
  seat: Seat;
  domino: Domino;
}

/** The suit a trick is being played to. */
export type LedSuit = { kind: 'trump' } | { kind: 'number'; n: Pip };

/** A trick in progress or completed. */
export interface Trick {
  leader: Seat;
  ledSuit: LedSuit | null;
  plays: PlayedDomino[];
  winner: Seat | null;
  points: number;
}

/** The high bid of an auction. */
export interface HighBid {
  seat: Seat;
  bid: Bid;
}

/** Result of a completed hand. */
export interface HandResult {
  made: boolean;
  bidTeam: Team;
  winTeam: Team;
  marksAwarded: number;
  points: Record<Team, number>;
  tricksWon: Record<Team, number>;
  bid: Bid;
  trump: Trump;
}

/**
 * The full, authoritative game state. Lives only on the server. Pure and
 * serializable so it can be persisted to Redis and rebuilt deterministically.
 */
export interface GameState {
  seed: number;
  phase: Phase;
  handNo: number;
  dealer: Seat;
  turn: Seat;
  hands: Record<Seat, Domino[]>;
  bids: Record<Seat, Bid | null>;
  highBid: HighBid | null;
  winningBid: HighBid | null;
  trump: Trump | null;
  trickNo: number;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  handPoints: Record<Team, number>;
  tricksWon: Record<Team, number>;
  marks: Record<Team, number>;
  handResult: HandResult | null;
  /** Seats (in turn order) that still need to act in the current auction. */
  toBid: Seat[];
}

/** Player intents applied to the engine. */
export type GameAction =
  | { type: 'PLACE_BID'; seat: Seat; bid: Bid }
  | { type: 'DECLARE_TRUMP'; seat: Seat; trump: Trump }
  | { type: 'PLAY_DOMINO'; seat: Seat; domino: Domino }
  | { type: 'READY_NEXT_HAND'; seat: Seat };

/** The set of actions legal for a seat in the current state. */
export interface LegalActions {
  bids: Bid[];
  canPass: boolean;
  trumps: Trump[];
  plays: Domino[];
}

/** A public, per-seat summary in a PlayerView. */
export interface SeatView {
  seat: Seat;
  name: string;
  team: Team;
  handCount: number;
  isDealer: boolean;
  bid: Bid | null;
}

/** A read-only projection of the state for one seat. Opponent hands are hidden. */
export interface PlayerView {
  you: Seat;
  phase: Phase;
  handNo: number;
  dealer: Seat;
  turn: Seat;
  yourHand: Domino[];
  yourLegalPlays: Domino[];
  yourLegalBids: Bid[];
  yourCanPass: boolean;
  yourLegalTrumps: Trump[];
  seats: Record<Seat, SeatView>;
  trump: Trump | null;
  highBid: HighBid | null;
  winningBid: HighBid | null;
  trickNo: number;
  currentTrick: { leader: Seat | null; ledSuit: LedSuit | null; plays: PlayedDomino[] };
  completedTricks: Trick[];
  handPoints: Record<Team, number>;
  tricksWon: Record<Team, number>;
  marks: Record<Team, number>;
  handResult: HandResult | null;
}
