import Redis from 'ioredis';
import { config } from './config.js';
import type { GameState } from '@texas42/shared';

/**
 * Active-game persistence. Uses Redis when REDIS_URL is configured (so state
 * survives restarts and is reconnect-ready), otherwise falls back to an
 * in-memory map so local dev works without Docker.
 */
export interface GameStore {
  save(gameId: string, state: GameState): Promise<void>;
  load(gameId: string): Promise<GameState | null>;
  delete(gameId: string): Promise<void>;
}

const GAME_TTL_SECONDS = 60 * 60 * 6; // games expire after 6h of inactivity

class MemoryStore implements GameStore {
  private games = new Map<string, GameState>();

  async save(gameId: string, state: GameState): Promise<void> {
    this.games.set(gameId, state);
  }
  async load(gameId: string): Promise<GameState | null> {
    return this.games.get(gameId) ?? null;
  }
  async delete(gameId: string): Promise<void> {
    this.games.delete(gameId);
  }
}

class RedisStore implements GameStore {
  constructor(private redis: Redis) {}

  private key(gameId: string): string {
    return `game:${gameId}`;
  }
  async save(gameId: string, state: GameState): Promise<void> {
    await this.redis.set(this.key(gameId), JSON.stringify(state), 'EX', GAME_TTL_SECONDS);
  }
  async load(gameId: string): Promise<GameState | null> {
    const raw = await this.redis.get(this.key(gameId));
    return raw ? (JSON.parse(raw) as GameState) : null;
  }
  async delete(gameId: string): Promise<void> {
    await this.redis.del(this.key(gameId));
  }
}

export function createGameStore(): GameStore {
  if (!config.redisUrl) {
    console.warn('[store] REDIS_URL not set — using in-memory game store.');
    return new MemoryStore();
  }
  try {
    const redis = new Redis(config.redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2 });
    redis.on('error', (err) => console.error('[redis] error:', err.message));
    console.info('[store] using Redis game store at', config.redisUrl);
    return new RedisStore(redis);
  } catch (err) {
    console.error('[store] Redis init failed, falling back to memory:', err);
    return new MemoryStore();
  }
}
