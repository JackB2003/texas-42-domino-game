import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { createGameStore } from './store.js';
import { GameManager } from './game/GameManager.js';
import { registerRoutes } from './routes.js';
import { attachSockets } from './socket.js';

async function main(): Promise<void> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: config.clientOrigin });

  const store = createGameStore();
  const manager = new GameManager(store);
  await registerRoutes(app, manager);

  await app.ready();
  attachSockets(app.server, manager);

  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Texas 42 server listening on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
