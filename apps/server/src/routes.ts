import type { FastifyInstance } from 'fastify';
import type {
  CreateGameRequest,
  CreateGameResponse,
  HealthResponse,
} from '@texas42/shared';
import type { GameManager } from './game/GameManager.js';

export async function registerRoutes(app: FastifyInstance, manager: GameManager): Promise<void> {
  app.get('/health', async (): Promise<HealthResponse> => ({ status: 'ok', uptime: process.uptime() }));

  app.post('/games', async (request): Promise<CreateGameResponse> => {
    const body = (request.body ?? {}) as CreateGameRequest;
    const room = manager.create({ seed: body.seed });
    return { gameId: room.id, seat: 0 };
  });

  // Phase 2 lobby endpoints are intentionally not implemented yet.
}
