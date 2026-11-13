import { randomUUID } from 'node:crypto';
import type { CreateGameOptions } from '@texas42/engine';
import { GameRoom } from './GameRoom.js';
import type { GameStore } from '../store.js';

/** Tracks the live GameRooms and mirrors their state to the store. */
export class GameManager {
  private rooms = new Map<string, GameRoom>();

  constructor(private readonly store: GameStore) {}

  create(opts: CreateGameOptions = {}): GameRoom {
    const id = randomUUID();
    const room = new GameRoom(id, opts, (state) => {
      void this.store.save(id, state);
    });
    this.rooms.set(id, room);
    void this.store.save(id, room.state);
    return room;
  }

  get(id: string): GameRoom | undefined {
    return this.rooms.get(id);
  }

  remove(id: string): void {
    this.rooms.get(id)?.close();
    this.rooms.delete(id);
    void this.store.delete(id);
  }
}
