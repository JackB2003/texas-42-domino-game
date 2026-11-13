# Texas 42

A server-authoritative single-player [Texas 42](https://en.wikipedia.org/wiki/42_(dominoes)) game — the classic four-player partnership domino trick-taking game. Phase 1 is a polished single-player experience: you (South) play with your partner Willie (North) against Uncle Si (West) and Bobby (East), all driven by a heuristic AI running on the server.

## Architecture

The server holds the one authoritative `GameState`. The client only ever renders a read-only `PlayerView` (opponent hands hidden) and sends _intent_ (place bid, declare trump, play domino) over a WebSocket. The server validates every action against the rules engine before applying it.

```
texas42/
├── packages/
│   ├── shared/   shared TypeScript types + WebSocket/REST contracts
│   ├── engine/   pure, dependency-free Texas 42 rules engine (+ Vitest tests)
│   └── ai/       heuristic AI (bidding, trump, play, void tracking)
├── apps/
│   ├── server/   Fastify + Socket.IO + Redis (runs all 4 seats)
│   └── web/      React + Vite + Tailwind + Zustand + Framer Motion client
├── docker-compose.yml
└── turbo.json
```

## Tech stack

- **Engine / AI:** pure TypeScript, no runtime deps, deterministic seeded RNG.
- **Server:** Node 20+, Fastify, Socket.IO, Redis (active state + session), Prisma schema (Phase 2 persistence).
- **Web:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion, Socket.IO client.
- **Monorepo:** Turborepo + npm workspaces. **Tests:** Vitest.

## Getting started

```bash
# 1. install
npm install

# 2. start Redis + Postgres
docker compose up -d

# 3. copy env
cp .env.example .env

# 4. run everything (server + web) in dev
npm run dev
```

The web client runs on http://localhost:5173 and the server on http://localhost:3001.

## Useful scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Run server + web in watch mode               |
| `npm run build`  | Build all packages and apps                  |
| `npm run test`   | Run the Vitest suites (engine rules, etc.)   |
| `npm run check`  | Type-check every workspace                   |
| `npm run lint`   | Lint every workspace                         |
| `npm run format` | Format the repo with Prettier                |

## Deployment

The whole stack can be run in containers, or deployed with the server and client hosted separately.

### Everything in Docker (local)

```bash
# builds + runs redis, postgres, the server, and the static web client
docker compose --profile full up --build
# web -> http://localhost:8080   server -> http://localhost:3001
```

(Plain `docker compose up -d` starts only Redis + Postgres for `npm run dev`.)

### Production

- **Server** → Fly.io (config in [fly.toml](fly.toml), image [Dockerfile.server](Dockerfile.server)). Provision a Redis add-on (e.g. Upstash) and set secrets:
  ```bash
  fly secrets set REDIS_URL=redis://... CLIENT_ORIGIN=https://your-web-host
  fly deploy
  ```
  Railway works the same way — point it at `Dockerfile.server` and add a Redis plugin.
- **Web** → any static host (Vercel, Netlify, Cloudflare Pages) or the nginx image at [apps/web/Dockerfile](apps/web/Dockerfile). Set `VITE_SERVER_URL` to the deployed server URL at build time.

## Status

Phase 1 (single-player) — see [docs/texas42-build-plan.md](docs/texas42-build-plan.md). Phase 2 (live multiplayer, lobby, auth) is scaffolded in structure and schema but not implemented.
