import {
  SEAT_NAMES,
  SEAT_TEAM,
  type GameState,
  type PlayerView,
  type Seat,
  type SeatView,
} from '@texas42/shared';
import { legalActions } from './game.js';

/** Project the authoritative state into a read-only view for one seat. */
export function toPlayerView(state: GameState, you: Seat): PlayerView {
  const legal = legalActions(state, you);

  const seats = {} as Record<Seat, SeatView>;
  for (const seat of [0, 1, 2, 3] as Seat[]) {
    seats[seat] = {
      seat,
      name: SEAT_NAMES[seat],
      team: SEAT_TEAM[seat],
      handCount: state.hands[seat].length,
      isDealer: state.dealer === seat,
      bid: state.bids[seat],
    };
  }

  return {
    you,
    phase: state.phase,
    handNo: state.handNo,
    dealer: state.dealer,
    turn: state.turn,
    yourHand: state.hands[you].slice(),
    yourLegalPlays: legal.plays,
    yourLegalBids: legal.bids,
    yourCanPass: legal.canPass,
    yourLegalTrumps: legal.trumps,
    seats,
    trump: state.trump,
    highBid: state.highBid,
    winningBid: state.winningBid,
    trickNo: state.trickNo,
    currentTrick: {
      leader: state.currentTrick?.leader ?? null,
      ledSuit: state.currentTrick?.ledSuit ?? null,
      plays: state.currentTrick?.plays.slice() ?? [],
    },
    completedTricks: state.completedTricks.slice(),
    handPoints: { ...state.handPoints },
    tricksWon: { ...state.tricksWon },
    marks: { ...state.marks },
    handResult: state.handResult,
  };
}
