import { describe, expect, it } from 'vitest';
import { ServerEvent, type PlayerView } from '@texas42/shared';
import { GameRoom, type Emitter } from '../src/game/GameRoom.js';
import type { Timing } from '../src/config.js';

const ZERO: Timing = {
  deal: 0,
  thinkBid: 0,
  thinkTrump: 0,
  thinkPlay: 0,
  trickHold: 0,
  scoreDelay: 0,
};

class FakeClient implements Emitter {
  views: PlayerView[] = [];
  events: { event: string; payload: unknown }[] = [];
  emit(event: string, payload?: unknown): void {
    this.events.push({ event, payload: payload ?? null });
    if (event === ServerEvent.GameView) this.views.push(payload as PlayerView);
  }
  last(): PlayerView | undefined {
    return this.views[this.views.length - 1];
  }
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** Drive a room to completion, acting as the human whenever it is seat 0's turn. */
async function playAsHuman(seed: number): Promise<FakeClient> {
  const room = new GameRoom('test', { seed }, undefined, ZERO);
  const client = new FakeClient();
  room.attach(client);
  room.start();

  for (let guard = 0; guard < 5000; guard++) {
    await tick();
    const v = client.last();
    if (!v) continue;
    if (v.phase === 'gameOver') break;

    if (v.turn === 0 && v.phase === 'bidding') {
      const bid = v.yourLegalBids[0] ?? { kind: 'pass' as const };
      await room.handleAction({ type: 'PLACE_BID', seat: 0, bid });
    } else if (v.turn === 0 && v.phase === 'trump') {
      await room.handleAction({ type: 'DECLARE_TRUMP', seat: 0, trump: v.yourLegalTrumps[0]! });
    } else if (v.turn === 0 && v.phase === 'playing') {
      await room.handleAction({ type: 'PLAY_DOMINO', seat: 0, domino: v.yourLegalPlays[0]! });
    } else if (v.phase === 'handEnd') {
      await room.handleAction({ type: 'READY_NEXT_HAND', seat: 0 });
    }
  }
  room.close();
  return client;
}

describe('GameRoom integration', () => {
  it('plays a full game over the socket protocol to game over', async () => {
    const client = await playAsHuman(42);
    expect(client.last()?.phase).toBe('gameOver');
    expect(client.events.some((e) => e.event === ServerEvent.GameOver)).toBe(true);
  });

  it('emits incremental events (bids, plays, trick resolutions)', async () => {
    const client = await playAsHuman(7);
    const names = new Set(client.events.map((e) => e.event));
    expect(names.has(ServerEvent.PlayerPlayed)).toBe(true);
    expect(names.has(ServerEvent.TrickResolved)).toBe(true);
    expect(names.has(ServerEvent.HandScored)).toBe(true);
    expect(names.has(ServerEvent.Dealing)).toBe(true);
  });

  it('rejects an out-of-turn action', async () => {
    const room = new GameRoom('reject', { seed: 1 }, undefined, ZERO);
    const client = new FakeClient();
    room.attach(client);
    // Before anything starts it is not the human's turn to declare trump.
    await room.handleAction({ type: 'DECLARE_TRUMP', seat: 0, trump: 'Sixes' });
    expect(client.events.some((e) => e.event === ServerEvent.ActionRejected)).toBe(true);
    room.close();
  });
});
