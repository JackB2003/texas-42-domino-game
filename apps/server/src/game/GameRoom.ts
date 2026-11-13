import {
  applyAction,
  beginBidding,
  createGame,
  toPlayerView,
  type CreateGameOptions,
} from '@texas42/engine';
import { decideAction } from '@texas42/ai';
import { ServerEvent, type GameAction, type GameState, type Seat } from '@texas42/shared';
import { TIMING, type Timing } from '../config.js';

const HUMAN: Seat = 0;

/** Anything that can receive server->client events (a Socket.IO socket). */
export interface Emitter {
  emit(event: string, payload?: unknown): void;
}

/**
 * One active game. Holds the authoritative state, runs the three AI seats with
 * human-like pacing, and emits incremental events followed by a full view so
 * the client can animate each transition before syncing.
 */
export class GameRoom {
  state: GameState;
  private socket: Emitter | null = null;
  private running = false;
  private busy = false;
  private closed = false;

  constructor(
    readonly id: string,
    opts: CreateGameOptions,
    private readonly onChange?: (state: GameState) => void,
    private readonly timing: Timing = TIMING,
  ) {
    this.state = createGame(opts);
  }

  /** Attach (or replace, on reconnect) the human's socket and resend the view. */
  attach(socket: Emitter): void {
    this.socket = socket;
    this.sendView();
  }

  detach(socket: Emitter): void {
    if (this.socket === socket) this.socket = null;
  }

  close(): void {
    this.closed = true;
  }

  /** Kick off the game loop (deal animation -> auction -> ...). */
  start(): void {
    void this.run();
  }

  private emit(event: string, payload?: unknown): void {
    this.socket?.emit(event, payload);
  }

  private sendView(): void {
    this.emit(ServerEvent.GameView, toPlayerView(this.state, HUMAN));
    this.onChange?.(this.state);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Handle an action originating from the human client. */
  async handleAction(action: GameAction): Promise<void> {
    if (this.running || this.busy) {
      this.emit(ServerEvent.ActionRejected, { reason: 'Please wait for your turn.' });
      return;
    }
    const ok = await this.applyAndEmit({ ...action, seat: HUMAN } as GameAction);
    if (ok) void this.run();
  }

  /**
   * Apply an action, emit the matching incremental event, sequence any trick
   * resolution / hand scoring with delays, then sync the full view.
   */
  private async applyAndEmit(action: GameAction): Promise<boolean> {
    const prev = this.state;
    const result = applyAction(prev, action);
    if (!result.ok) {
      this.emit(ServerEvent.ActionRejected, { reason: result.reason });
      return false;
    }
    this.busy = true;
    try {
      switch (action.type) {
        case 'PLACE_BID':
          this.emit(ServerEvent.PlayerBid, { seat: action.seat, bid: action.bid });
          break;
        case 'DECLARE_TRUMP':
          this.emit(ServerEvent.PlayerDeclared, { seat: action.seat, trump: action.trump });
          break;
        case 'PLAY_DOMINO':
          this.emit(ServerEvent.PlayerPlayed, { seat: action.seat, domino: action.domino });
          break;
      }

      const next = result.state;
      const trickResolved =
        action.type === 'PLAY_DOMINO' && next.completedTricks.length > prev.completedTricks.length;
      this.state = next;

      if (trickResolved) {
        const resolved = next.completedTricks[next.completedTricks.length - 1]!;
        await this.sleep(this.timing.trickHold);
        if (this.closed) return true;
        this.emit(ServerEvent.TrickResolved, {
          winner: resolved.winner,
          points: resolved.points,
          plays: resolved.plays,
        });
      }

      if ((next.phase === 'handEnd' || next.phase === 'gameOver') && next.handResult) {
        await this.sleep(this.timing.scoreDelay);
        if (this.closed) return true;
        this.emit(ServerEvent.HandScored, next.handResult);
        if (next.phase === 'gameOver') {
          const winnerTeam = next.marks.us >= next.marks.them ? 'us' : 'them';
          this.emit(ServerEvent.GameOver, { winnerTeam, marks: next.marks });
        }
      }

      this.sendView();
      return true;
    } finally {
      this.busy = false;
    }
  }

  /** Advance the game through AI turns until it is the human's move or terminal. */
  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (!this.closed) {
        const s = this.state;

        if (s.phase === 'dealing') {
          this.emit(ServerEvent.Dealing, { handNo: s.handNo, dealer: s.dealer });
          this.sendView();
          await this.sleep(this.timing.deal);
          if (this.closed) return;
          this.state = beginBidding(this.state);
          this.sendView();
          continue;
        }

        if (s.phase === 'handEnd' || s.phase === 'gameOver') return;
        if (s.turn === HUMAN) return;

        const delay =
          s.phase === 'bidding'
            ? this.timing.thinkBid
            : s.phase === 'trump'
              ? this.timing.thinkTrump
              : this.timing.thinkPlay;
        await this.sleep(delay);
        if (this.closed) return;

        const action = decideAction(this.state, this.state.turn);
        if (!action) return;
        await this.applyAndEmit(action);
      }
    } finally {
      this.running = false;
    }
  }
}
