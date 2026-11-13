/**
 * REST/lobby API contracts. Phase 1 only uses {@link CreateGameResponse};
 * the lobby shapes are defined now so the Phase 2 surface is stable.
 */

export interface CreateGameRequest {
  /** Optional deterministic seed (mainly for tests/replays). */
  seed?: number;
}

export interface CreateGameResponse {
  gameId: string;
  /** The seat the human controls (always 0 in Phase 1). */
  seat: 0;
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
}

/** ----- Phase 2 lobby contracts (scaffolded, not implemented) ----- */

export type RoomStatus = 'waiting' | 'in_progress' | 'complete';

export interface RoomSummary {
  id: string;
  code: string;
  status: RoomStatus;
  playerCount: number;
  isPrivate: boolean;
}

export interface CreateRoomRequest {
  isPrivate: boolean;
  allowIndicating?: boolean;
}

export interface JoinRoomRequest {
  code: string;
  username: string;
}
