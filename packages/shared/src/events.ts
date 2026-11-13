import type {
  Bid,
  Domino,
  HandResult,
  PlayedDomino,
  PlayerView,
  Seat,
  Team,
  Trump,
} from './types.js';

/** Socket.IO event name constants. */
export const ClientEvent = {
  PlaceBid: 'PLACE_BID',
  DeclareTrump: 'DECLARE_TRUMP',
  PlayDomino: 'PLAY_DOMINO',
  ReadyNextHand: 'READY_NEXT_HAND',
  JoinGame: 'JOIN_GAME',
} as const;

export const ServerEvent = {
  GameView: 'GAME_VIEW',
  PlayerBid: 'PLAYER_BID',
  PlayerDeclared: 'PLAYER_DECLARED',
  PlayerPlayed: 'PLAYER_PLAYED',
  TrickResolved: 'TRICK_RESOLVED',
  HandScored: 'HAND_SCORED',
  GameOver: 'GAME_OVER',
  Dealing: 'DEALING',
  ActionRejected: 'ACTION_REJECTED',
} as const;

/** Client -> Server payloads. */
export interface ClientToServerEvents {
  [ClientEvent.JoinGame]: (payload: { gameId: string }) => void;
  [ClientEvent.PlaceBid]: (payload: { bid: Bid }) => void;
  [ClientEvent.DeclareTrump]: (payload: { trump: Trump }) => void;
  [ClientEvent.PlayDomino]: (payload: { domino: Domino }) => void;
  [ClientEvent.ReadyNextHand]: () => void;
}

/** Server -> Client payloads. */
export interface ServerToClientEvents {
  [ServerEvent.GameView]: (payload: PlayerView) => void;
  [ServerEvent.Dealing]: (payload: { handNo: number; dealer: Seat }) => void;
  [ServerEvent.PlayerBid]: (payload: { seat: Seat; bid: Bid }) => void;
  [ServerEvent.PlayerDeclared]: (payload: { seat: Seat; trump: Trump }) => void;
  [ServerEvent.PlayerPlayed]: (payload: { seat: Seat; domino: Domino }) => void;
  [ServerEvent.TrickResolved]: (payload: {
    winner: Seat;
    points: number;
    plays: PlayedDomino[];
  }) => void;
  [ServerEvent.HandScored]: (payload: HandResult) => void;
  [ServerEvent.GameOver]: (payload: { winnerTeam: Team; marks: Record<Team, number> }) => void;
  [ServerEvent.ActionRejected]: (payload: { reason: string }) => void;
}
