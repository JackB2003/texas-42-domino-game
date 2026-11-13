# Texas 42 — Phase 1 Build Plan

> Saved copy of the agreed implementation plan. Overview: Build a complete,
> server-authoritative single-player Texas 42 game as a Turborepo monorepo: a
> pure-TS rules engine + heuristic AI, a Fastify/Socket.IO/Redis backend that
> runs all 4 seats, and a responsive React+Vite client that matches the
> high-fidelity design pixel-for-pixel with Framer Motion animations.

## Decisions locked
- **Architecture:** Full server-authoritative from day one (Fastify + Socket.IO + Redis + Postgres/Prisma). The server holds the one `GameState`; the client renders a read-only `PlayerView`. Even in single-player, the server runs seat 0 (human, "You") via WebSocket and seats 1–3 via `packages/ai`.
- **Scope:** Phase 1 (single-player) only. Phase 2 surfaces (lobby, auth, multiplayer) are scaffolded in structure/schema but not built.
- **Responsive:** mobile (375–767), tablet (768–1023), desktop (1024+) from the start, with the 1280×800 design as the desktop reference.
- **Stack:** React 18 + Vite + TypeScript + Tailwind + Zustand + Framer Motion + Socket.IO client.
- **Design is authoritative for all UI** (`design/README.md`). Where the PRD disagrees, design wins: bids **31–42** + "1 Mark"/"2 Marks"; trump labels **Blanks, Ones, Twos, Threes, Fours, Fives, Sixes, Doubles, Follow Me**; teams render **blue `#3D6FB4` (You + Willie) vs gold `#BF8F2A` (Uncle Si + Bobby)**; scorecard is **7-segment mark bars** (not the "ALL" letterform); fonts **Rye + Libre Franklin**; dark felt only.

> Note: the PRD claims `packages/engine` is "already built & tested" — it is **not** present. The repo currently only has `design/` and `docs/`. The engine is built from scratch here.

## Repository structure (Turborepo + npm workspaces)
```
texas42/
├── packages/
│   ├── shared/   types: Domino, Seat, Trump, Bid, Phase, GameState, PlayerView, events, protocol
│   ├── engine/   pure reducer: deal, legalActions, applyAction, trick/scoring/marks + Vitest tests
│   └── ai/       heuristic bidding, trump, play, void tracking
├── apps/
│   ├── server/   Fastify + Socket.IO + Redis; GameRoom/GameManager; AI driver; Prisma schema
│   └── web/      React + Vite client (components, stores, animations, hooks)
├── docker-compose.yml   (node optional + redis + postgres)
├── turbo.json
└── package.json
```

## 1. Engine (`packages/engine`) — the foundation, build + test first
Domino = `{ t: number; b: number }` (0–6 each), 28 unique tiles. Pure, dependency-free, seeded RNG for deterministic tests.
- `createGame(seed, dealer)`, `deal(state)` — shuffle 28, 7 per seat.
- `legalActions(state, seat)` — bids (must beat current high, 31–42, 1/2 marks), trump (9 options), legal plays (follow-suit enforcement using trump rules).
- `applyAction(state, action)` → new state (bid | declareTrump | playDomino | readyNext). Rejects illegal actions before any mutation.
- **Trump/suit logic** (from design `isTrumpTile`): Doubles trump = `t===b`; Follow Me = no trump; number suit = tile contains that number on either end. Led-suit + follow-suit + trick-winner resolution.
- **Scoring:** count tiles = 5-5 (10), 6-4 (10), 5-0/4-1/3-2 (5 each) = 35; +1 per trick = 42 total. Bid made/set resolution; mark bids ("1 Mark"=42, "2 Marks") require capturing all 42. Mark accumulation to 7; auto-redeal on all-pass; clockwise dealer rotation.
- **Seats (clockwise):** 0 = You (S), 1 = Uncle Si (W), 2 = Willie (N, partner), 3 = Bobby (E). Teams: {0,2}=us, {1,3}=them. Turn/deal order S→W→N→E matches the design deal animation.
- Vitest suite covering follow-suit legality, trick winners across trump cases, count/total scoring, made-vs-set, marks, all-pass redeal.

## 2. Shared types (`packages/shared`)
`PlayerView` (opponent hands hidden — only counts), WebSocket event shapes, and lobby/protocol contracts. Client → Server: `PLACE_BID`, `DECLARE_TRUMP`, `PLAY_DOMINO`, `READY_NEXT_HAND`. Server → Client: `GAME_VIEW` (full PlayerView), incremental `PLAYER_BID`/`PLAYER_DECLARED`/`PLAYER_PLAYED`/`TRICK_RESOLVED`/`HAND_SCORED`/`GAME_OVER`, plus `ACTION_REJECTED`.

## 3. AI (`packages/ai`)
Heuristic agent consuming engine state via `legalActions`: bid valuation (double +4, trump tile +3, count tile +2), trump pick (most tiles + double bonus), declarer/defender play heuristics, and public void tracking. Pure functions so Phase 2 MCTS can reuse rollouts.

## 4. Server (`apps/server`)
- **Fastify** REST: `POST /games` (create single-player game), health check. Lobby endpoints stubbed for Phase 2.
- **Socket.IO**: one `GameRoom` per game holding authoritative `GameState`; `GameManager` indexes rooms. Handlers validate intent against `legalActions`, apply via engine, then emit the *what happened* event, then the updated `GAME_VIEW` (per the PRD's animate-then-sync pattern).
- **AI driver:** after the human acts, the server steps seats 1–3 with staggered delays (≈450ms cadence, mirroring the design reveal timing) emitting incremental events so the client animates each play.
- **Redis:** active game state + socket↔player mapping (reconnect-ready). Single instance for Phase 1; Pub/Sub deferred.
- **Prisma:** `users`, `game_results`, `player_stats` schema authored + migration, but not wired into the Phase 1 loop (no persistence needed yet).

## 5. Web client (`apps/web`)
- **Stores (Zustand):** `socketStore` (connection + event intake), `gameStore` (latest `PlayerView`, phase, pendingAction — only mutated by `GAME_VIEW`), `uiStore` (selected tile, animation queue, measured trick-slot `DOMRect`s).
- **Design tokens** in Tailwind config: felt gradient, team blue/gold palettes, modal/parchment neutrals, radii/shadows; Rye + Libre Franklin via Google Fonts.
- **`DominoTile`** component to design spec: aspect 1:1.92, 3×3 pip grids, double-six pip colors, divider, face-down panel, gold trump glow, size prop (hand 62 / center 42 / fans 19–21 / rail 20 / deal 46).
- **Table layout** matching `design/README.md`: TopHUD (logo, two team-mark cards, hand-points bar, BID/TRUMP/WON-BY card), TrickHistoryRail (7 cards), four Seats, center TrickArea (4 compass slots + hub + status pill), and the human Hand row.
- **Overlays:** ShuffleDeal, Bidding (31–42 + marks + Pass), DeclareTrump (9 buttons), HandComplete (BID MADE / SET), GameOver.
- **Animations (Framer Motion):** deal (28 staggered tiles from center, ~800ms), play (`layoutId` hand→center slot, directional fly), count `+5/+10` float, trick resolve (winner pulse → collect), marks segment fill, between-hands sweep. All gated on `prefers-reduced-motion` (fades only).
- **Responsive:** desktop = fixed compass; tablet = scaled compass; mobile = single-column with horizontally scrollable hand and scaled trick area.
- **Accessibility:** keyboard hand navigation + select/play, ARIA labels, legality shown via opacity + border (not color alone).

## 6. Quality & delivery
- Vitest across engine/ai/server; an end-to-end "full hand" pass driving the socket loop.
- Performance audit: bundle < 250kb gzipped (code-split lobby vs game), 60fps animation check.
- `docker-compose.yml` (redis + postgres + optional node) for one-command local dev; deploy target Railway/Fly (persistent WS + Redis add-on).

## Build order (dependency-first)
engine + shared → ai → server (game loop vs AI) → web shell + stores → tile + static table → bidding/trump wiring → play phase → animations → scoring/game-over → responsive → a11y/perf → deploy.

## Task checklist
- [ ] **scaffold** — Scaffold Turborepo monorepo: npm workspaces, turbo.json, TS project refs, Vitest, ESLint/Prettier, docker-compose (redis + postgres), root scripts.
- [ ] **shared** — Build packages/shared: Domino/Seat/Trump/Bid/Phase/GameState/PlayerView types, WebSocket events.ts, and protocol.ts contracts.
- [ ] **engine** — Build packages/engine pure reducer (createGame/deal/legalActions/applyAction, trump+follow-suit, trick winner, 42-point scoring, made/set, marks, all-pass redeal, dealer rotation) with seeded RNG.
- [ ] **engine-tests** — Write Vitest suite for engine: follow-suit legality, trick winners across trump cases, count/total scoring, made-vs-set, marks-to-7, all-pass redeal.
- [ ] **ai** — Build packages/ai heuristic agent: bid valuation, trump declaration, declarer/defender play, public void tracking.
- [ ] **server** — Build apps/server: Fastify REST (create game/health), Socket.IO GameRoom/GameManager, action validation + emit (incremental then GAME_VIEW), staggered AI driver, Redis state/session store, Prisma schema + migration (unwired).
- [ ] **web-shell** — Scaffold apps/web (Vite+React+TS+Tailwind), Google Fonts (Rye/Libre Franklin), design tokens, and Zustand socketStore/gameStore/uiStore with PlayerView intake.
- [ ] **tile-table** — Build DominoTile (design spec: pips, colors, trump glow, face-down, sizes) and static Table layout: TopHUD, TrickHistoryRail, four Seats, center TrickArea, Hand.
- [ ] **bid-trump** — Wire Bidding overlay (31-42 + 1/2 Mark + Pass) and Declare Trump overlay (9 options) to socket actions with live bid status.
- [ ] **play-phase** — Implement play phase: legal-tile highlighting, tap-to-select/confirm, live TrickArea slot updates from incremental events, running totals.
- [ ] **animations** — Add Framer Motion animations: deal, layoutId play-to-center, count +5/+10 float, trick resolve + collect, marks segment fill, between-hand sweep; honor prefers-reduced-motion.
- [ ] **scoring-ui** — Build HandComplete (BID MADE/SET, point cards, marks line) and GameOver overlays; auto-advance + next-hand/new-game flows.
- [ ] **responsive** — Add responsive layouts: scaled compass for tablet, single-column + scrollable hand for mobile (375px min).
- [ ] **a11y-perf** — Keyboard navigation/ARIA, non-color legality cues, bundle code-split + size check, 60fps animation audit, end-to-end full-hand test.
- [ ] **deploy** — Finalize docker-compose dev flow and deploy to Railway/Fly with Redis add-on.
