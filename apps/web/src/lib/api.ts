import type { CreateGameResponse } from '@texas42/shared';
import { SERVER_URL } from './config.js';

export async function createGame(seed?: number): Promise<CreateGameResponse> {
  const res = await fetch(`${SERVER_URL}/games`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(seed === undefined ? {} : { seed }),
  });
  if (!res.ok) throw new Error(`Failed to create game (${res.status})`);
  return (await res.json()) as CreateGameResponse;
}
