# Texas 42 — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Scope:** Phase 1 (single-player) → Phase 2 (live multiplayer)

---

## 1. Stack Recommendation & Rationale

### Why this stack, not what you already know

The two things that make online game development different from normal web development
are: (1) the server must be the *authority* — clients never trust themselves, and
(2) the UI must animate state changes fluidly without blocking interaction.

The choices below optimize for both.

---

### Frontend

| Technology | Role | Why |
|---|---|---|
| **React 18** + TypeScript | UI framework | Concurrent rendering handles animation + game state without tearing. Already aligned with the engine types. |
| **Vite** | Build tool | Sub-100ms dev reloads, native ESM, fastest cold starts. |
| **Framer Motion** | Animations | The standard for production-quality React animation. Handles layout animations (tiles moving between positions) with zero manual calculation. `layoutId` alone solves the "tile slides from hand to trick area" problem. |
| **Zustand** | Client state | Tiny, TypeScript-native. One store for game view, one for UI state (selected tile, animation queue). No boilerplate. |
| **Tailwind CSS** | Styling | Utility-first keeps component files readable. JIT compilation means bundle only includes what's used. |
| **Socket.IO client** | Real-time | See server below. Shares the same event model. |

### Backend

| Technology | Role | Why |
|---|---|---|
| **Node.js 22 LTS** + TypeScript | Runtime | Shares the exact same engine package the tests already pass on. One language, zero translation layer. |
| **Fastify** | HTTP server | 2–3× faster than Express, first-class TypeScript, schema-first validation. Handles the lobby API (create room, list rooms, user auth). |
| **Socket.IO** | WebSocket server | Built-in room model maps directly to game rooms. Handles reconnection/session recovery out of the box — critical for games. Namespace support lets Phase 2 isolate game traffic from lobby traffic. |
| **Redis** | Session & pub/sub | Active game state lives in Redis (fast, TTL-based cleanup). In Phase 2, Redis Pub/Sub lets multiple server instances share game events without coordination code. |
| **PostgreSQL** | Persistence | Game history, user accounts, leaderboards. Only required for Phase 2, but schema should be designed from day one. |
| **Prisma** | ORM | Type-safe queries generated from the schema. Migrations that version-control the database. |

### Infrastructure

| Technology | Role |
|---|---|
| **Docker** + **Docker Compose** | Local dev: one command starts Node + Redis + Postgres |
| **Railway** or **Fly.io** | Production hosting. Both support persistent WebSocket connections and Redis add-ons. Deploy from `git push`. |
| **Vitest** | Fast, Vite-native test runner (replaces the current `node:test` setup). |

### Why not something more exotic?

- **Go / Elixir** — both excellent for real-time, but the engine is TypeScript and rewriting it (or bridging languages) costs more than it gains for a card game's concurrency needs. Node.js handles thousands of concurrent WebSocket connections without issue.
- **Unity / Phaser** — game engines are overkill. Dominos are rectangles. Framer Motion gives us everything we need with a fraction of the bundle size.
- **GraphQL subscriptions** — more ceremony than WebSockets for a game. Socket.IO events are the right abstraction.

---

## 2. Repository Structure

```
texas42/
├── packages/
│   ├── engine/          ← already built & tested (pure TS, zero deps)
│   │   ├── src/
│   │   └── test/
│   ├── shared/          ← types shared between client and server
│   │   └── src/
│   │       ├── events.ts      (WebSocket event shapes)
│   │       └── protocol.ts    (room/lobby API contracts)
│   └── ai/              ← Phase 1: heuristics. Phase 2: same, runs server-side.
│       └── src/
├── apps/
│   ├── web/             ← React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── game/      (Table, TrickArea, DominoTile, Hand, ...)
│   │   │   │   ├── lobby/     (RoomList, CreateRoom, JoinRoom)
│   │   │   │   └── ui/        (Button, Modal, Scorecard, ...)
│   │   │   ├── stores/        (gameStore, uiStore, socketStore)
│   │   │   ├── animations/    (variants, transitions, layout IDs)
│   │   │   └── hooks/         (useGame, useSocket, useLegalPlays)
│   └── server/          ← Fastify + Socket.IO backend
│       └── src/
│           ├── game/          (GameRoom, GameManager)
│           ├── lobby/         (room CRUD, matchmaking)
│           ├── ai/            (import from packages/ai)
│           └── socket/        (event handlers, auth middleware)
├── docker-compose.yml
└── turbo.json           ← Turborepo: parallel builds, shared cache
```

**Turborepo** manages the monorepo. `turbo build` and `turbo test` run all packages
in dependency order with caching. `packages/engine` never rebuilds unless its source
changes.

---

## 3. System Architecture

```
Browser (React app)
    │
    │  HTTP (REST)         ← lobby: create room, list rooms, auth
    │  WebSocket (WS)      ← game: all real-time events
    ▼
Fastify + Socket.IO Server
    │
    ├── GameRoom           ← one instance per active game
    │     ├── GameState    ← authoritative engine state (from packages/engine)
    │     ├── AI agents    ← run server-side for empty seats
    │     └── Timer        ← turn timeout enforcement (Phase 2)
    │
    ├── Redis
    │     ├── Session store ← socket-to-player mapping for reconnect
    │     ├── Room index    ← active game lookup
    │     └── Pub/Sub       ← inter-server events (Phase 2 multi-instance)
    │
    └── PostgreSQL
          ├── users
          ├── game_results
          └── player_stats
```

### The authoritative server rule

The server holds the one and only `GameState`. Clients hold a `PlayerView` — a
read-only projection of the state with opponent hands hidden. Clients send *intent*
(bid 34, play the 6-4); the server validates against `legalActions()` and either
applies or rejects the action. A client can never cheat by seeing cards it shouldn't
or playing out of turn — rejection happens before any state change.

### Phase 1 simplification

In Phase 1, the server loop handles all 4 seats. Seat 0 is controlled by the human
(via WebSocket events). Seats 1–3 are controlled by `packages/ai`. The same
architecture runs locally or deployed — no special single-player code path needed.

---

## 4. WebSocket Event Protocol

All events are typed in `packages/shared/src/events.ts` and shared between client
and server.

### Client → Server (actions)

```ts
// Player submits a bid
{ event: 'PLACE_BID',  payload: { bid: Bid } }

// Player declares trump
{ event: 'DECLARE_TRUMP', payload: { trump: Trump } }

// Player plays a domino
{ event: 'PLAY_DOMINO', payload: { domino: Domino } }

// Player requests to advance past the score screen
{ event: 'READY_NEXT_HAND' }
```

### Server → Client (view updates)

```ts
// Full state refresh for this seat (sent on join, reconnect, phase change)
{ event: 'GAME_VIEW', payload: PlayerView }

// Incremental: another player took an action (for animation triggers)
{ event: 'PLAYER_BID',    payload: { seat: Seat; bid: Bid } }
{ event: 'PLAYER_DECLARED', payload: { seat: Seat; trump: Trump } }
{ event: 'PLAYER_PLAYED',   payload: { seat: Seat; domino: Domino } }
{ event: 'TRICK_RESOLVED',  payload: { winner: Seat; points: number; plays: PlayedDomino[] } }
{ event: 'HAND_SCORED',     payload: HandResult }
{ event: 'GAME_OVER',       payload: { winnerTeam: Team; marks: [number, number] } }

// Error (illegal action attempted)
{ event: 'ACTION_REJECTED', payload: { reason: string } }
```

The pattern is: the server sends *what happened* (PLAYER_PLAYED), the client
animates it, then the server sends the updated full view (GAME_VIEW) for the new
phase. This separation keeps animations decoupled from state updates.

---

## 5. Feature Requirements

### Phase 1 — Single Player (MVP)

#### F1.1 Game Loop
- [ ] Full Texas 42 hand: deal → bid → declare trump → 7 tricks → score
- [ ] 3 AI opponents (heuristic-based, see `packages/ai`)
- [ ] Correct trump logic: number-suit, doubles, no-trump
- [ ] Correct follow-suit enforcement (legal plays only)
- [ ] Correct scoring: tricks (1pt) + count (5pt/10pt)
- [ ] Correct bid resolution: made vs. set
- [ ] Mark accumulation to 7 marks wins
- [ ] Automatic redeal on all-pass
- [ ] Dealer rotation clockwise each hand

#### F1.2 Bidding UI
- [ ] Display each player's bid as it happens (AI bids visible as brief labels)
- [ ] Human bidding panel: Pass button + legal bid amounts (30–41) + 1/2 Mark buttons
- [ ] Only legal bids shown/enabled (no bid ≤ current high)
- [ ] Current high bid and bidder displayed persistently
- [ ] Bids made by AI shown as animated toast near that player's position

#### F1.3 Trump Declaration UI
- [ ] 9 trump options shown as labeled buttons: Blanks, Aces, Deuces, Treys, Fours, Fives, Sixes, Doubles, No Trump
- [ ] Preview: hovering/tapping a trump option highlights which tiles in the human's hand would become trump
- [ ] After declaration, trump persists visibly in the UI for the entire hand

#### F1.4 Play UI
- [ ] All 7 human tiles displayed face-up in the player's hand area
- [ ] Legal tiles highlighted in green; illegal tiles dimmed — updates every play
- [ ] Single-tap to select, tap again to confirm play (or tap a different tile to reselect)
- [ ] Played tile animates from hand to the player's trick position
- [ ] Trick area shows all 4 compass positions; tiles appear in seat position as played
- [ ] Led suit shown in the trick area center
- [ ] Count tiles that land in a trick emit a brief "+5" or "+10" float animation
- [ ] After all 4 tiles played: winner tile pulses, all 4 tiles animate to the winning player's collection area
- [ ] Running totals (tricks won, points captured per team) displayed during play

#### F1.5 Scoring UI
- [ ] Hand result screen: bid made or set, points breakdown, which team earned the mark
- [ ] Marks scorecard using the traditional "ALL" letter-segment display
- [ ] Auto-advance to next hand after 3 seconds (with option to dismiss early)

#### F1.6 Game States
- [ ] New game / new hand transition animation (tiles sweep off, fresh deal)
- [ ] Game over screen: winner, final mark count, Play Again button
- [ ] "Thinking" indicator on AI player positions during their turn
- [ ] Persistent display: current dealer marker, whose turn it is

---

### Phase 2 — Live Multiplayer

#### F2.1 Authentication
- [ ] Guest play (no account, temporary username)
- [ ] Account creation (email + password, or OAuth via Google)
- [ ] Persistent stats and game history for registered users

#### F2.2 Lobby
- [ ] Create public or private room (with join code)
- [ ] Room list with status (waiting, in progress, complete)
- [ ] Join by room code
- [ ] Player count display (1–4 / 4)
- [ ] Chat in lobby (text only)
- [ ] AI fills empty seats if game starts with < 4 humans

#### F2.3 In-Game Multiplayer
- [ ] All Phase 1 game logic unchanged (engine is shared)
- [ ] Turn timer: 45 seconds per action. Visual countdown ring on the active player. Auto-pass/auto-play on timeout.
- [ ] Reconnection: if a player disconnects, the game waits 60 seconds. AI takes over their seat if they don't return.
- [ ] Spectator mode: observers see played tiles and public information only (no hands)
- [ ] Post-hand chat
- [ ] Rematch button (all 4 players must accept)

#### F2.4 Indicating (Optional, configurable)
- [ ] Toggle in room settings: "Allow indicating" (on by default for social play, off for tournament)
- [ ] Standard indicators tracked as public information

#### F2.5 Game Variants (Configurable)
- [ ] Nel-O (forced bid for dealer when all others pass)
- [ ] Plunge (bid 4 marks if holding 4+ doubles)
- [ ] Double-the-marks (mark bids can double rather than +1)

---

## 6. Animation Requirements

Animations are a first-class requirement, not a polish step. Every state transition
has a defined animation. All durations use the scale below.

### Duration scale
```
instant  : 0ms    (state-only, no visual change)
snap     : 100ms  (feedback: button press, selection highlight)
quick    : 200ms  (micro: chip appearing, indicator flash)
normal   : 350ms  (tile plays: hand → trick area)
slow     : 500ms  (trick resolves: tiles collect)
scene    : 800ms  (deal: 28 tiles fan out to hands)
breath   : 1200ms (between hands: table sweep + reset)
```

### Animation inventory

#### Dealing
- 28 tiles emerge from the center of the table
- Fan out to 4 hand positions (staggered, 30ms between each tile)
- Human tiles flip face-up one by one as they arrive
- AI tiles remain face-down
- Total duration: ~800ms (scene)
- Easing: spring with slight bounce on arrival

#### Bidding
- Each AI bid: a label appears next to the player's position, holds 600ms, fades
- Human bidding panel slides up from bottom
- Pass fades the bid panel away
- High bid updates: the current bid badge "pops" (scale 1→1.15→1)

#### Trump Declaration
- Trump chosen: all tiles in the human's hand that are now trump get a brief
  amber pulse (scale + color flash, 200ms)
- Trump badge appears in the UI header (slide-in from left)
- AI declaration: a brief "Sixes are trump" toast near the declarer's position

#### Playing a Tile
- Tile lifts (y: -8px, scale: 1.05) when selected — immediate (snap)
- On confirmation: tile animates from its hand position to the trick slot for
  that player. Use Framer Motion `layoutId` so the tile's identity is preserved
  across the DOM position change. Duration: normal (350ms)
- Hand closes the gap where the tile was (layout animation, automatic)

#### Count tile in a trick
- When a 5- or 10-point tile lands in the trick area: a "+5" or "+10" label
  emerges from the tile, floats upward 24px, fades out. Duration: 600ms.

#### Trick resolution
- Winning tile: border flash (gold, 2 pulses), scale 1→1.1→1
- Other 3 tiles: after 400ms hold, all 4 tiles animate toward the winning
  player's collection pile (bottom-right of their area)
- Collection pile grows visually (stack indicator)
- Score row updates with animated number increment

#### Between hands (SCORE → DEAL)
- Score screen holds for 2.5s
- All trick piles slide off screen toward their respective corners (staggered)
- Table fades to a brief empty state (200ms)
- New deal begins (scene animation)

#### Marks scorecard
- When a mark is earned: the next segment of the "ALL" letterform strokes in
  with an SVG path animation (draw-on effect, 400ms)
- Team earning the mark: brief celebration (subtle, not obnoxious)

#### Turn indicator
- Active player position has an animated ring (rotating conic-gradient or
  SVG stroke-dashoffset animation)
- Phase 2: turn timer ring depletes clockwise over 45 seconds

### Reduced motion
- All animations respect `prefers-reduced-motion: reduce`
- Reduced mode: animations become instant fades (opacity only, no position/scale)

---

## 7. Tile & Table Rendering

### Domino tile
Rendered as SVG. Each tile is a rectangle (aspect ratio ~2:1) with:
- Two halves separated by a center line
- Classic dot pattern for pips 0–6
- Rounded corners
- Variants: normal, selected (lifted), legal (green highlight), dimmed, face-down

Tile sizing:
- Hand tiles (human): 64×32px at 1×
- Trick area tiles: 56×28px
- AI hand tiles (face-down): 24×12px stacked
- Mobile: scale all ×0.85

### Table layout (compass)
```
             [North hand — face down]
[West hand]     [Trick area]     [East hand]
             [South hand — face up]
```

The trick area is a fixed-size zone in the center. Each played tile sits in one
of 4 positions corresponding to the compass seat. Positions are fixed so tiles
always animate to a predictable location.

### Trick area positions (example absolute values)
```
         (center-x, top)
(left, center-y)    (right, center-y)
         (center-x, bottom)
```

These positions are measured once (via `ref`) and used as animation targets.
Framer Motion's `AnimatePresence` handles tiles entering and leaving.

---

## 8. State Management (Client)

Two Zustand stores, strictly separated:

### `gameStore` — server-driven
```ts
interface GameStore {
  view: PlayerView | null;         // latest view from server
  phase: Phase;
  pendingAction: boolean;          // waiting for server acknowledgment
  setView: (v: PlayerView) => void;
  setPending: (p: boolean) => void;
}
```
This store only updates when the server sends a `GAME_VIEW` event. The client
never optimistically mutates this — it always waits for the server.

### `uiStore` — client-only
```ts
interface UIStore {
  selectedDomino: Domino | null;
  animationQueue: AnimationEvent[];
  trickPositions: Record<Seat, DOMRect>; // measured positions for animation
  selectDomino: (d: Domino | null) => void;
  enqueueAnimation: (e: AnimationEvent) => void;
  dequeueAnimation: () => void;
}
```

### Event flow
```
Server sends PLAYER_PLAYED
    ↓
socketStore receives it
    ↓
uiStore.enqueueAnimation({ type: 'TILE_PLAYED', seat, domino })
    ↓
Animation plays (TrickArea renders the tile in position)
    ↓ (animation complete callback)
Server sends GAME_VIEW with updated state
    ↓
gameStore.setView(newView)
    ↓
UI re-renders with new hand counts, new trick state
```

The animation and the state update are sequenced. The UI does not snap to the
new state mid-animation.

---

## 9. AI Requirements (`packages/ai`)

### Phase 1 (heuristics — ship this)

#### Bidding
- Count tiles per potential trump suit (including both ends of each tile)
- Weight: double in that suit +4, each trump tile +3, each count tile +2
- Bid up to (estimated − safety margin); pass if can't beat current high

#### Trump declaration
- Pick the suit with the most tiles + highest double bonus
- Tiebreak: prefer a suit where you hold the double

#### Play — as declarer
- Lead high trumps first (pull opponent trumps)
- Track voids revealed during play
- Lead toward partner (tile whose suit partner likely has)
- Play count tiles onto tricks your team wins

#### Play — as defender
- Trump in when you can catch a count tile and win the trick
- When partner is winning: throw off the least valuable tile
- When unable to win: throw off cheapest non-count tile
- For mark bids: prioritize stealing any one trick to set them

#### Void tracking
After every play, the AI tracks known voids per seat (if a player didn't follow
suit, they're void in that suit). This information is public and the AI uses it.

### Phase 2 (upgrade path — not required for launch)
Determinized Monte Carlo Tree Search (DMCTS). For each action, sample 20–50 possible
opponent hands consistent with known constraints, run fast rollouts using the heuristic
player for all seats, pick the action with the best average outcome. Because the engine
is a pure reducer, rollouts are just `reduce` calls in a loop — no special simulation
code needed.

---

## 10. Non-Functional Requirements

### Performance
- Time to interactive (single-player): < 2 seconds on 4G
- WebSocket round-trip (action → view update): < 100ms p95 on same continent
- Animation: consistent 60fps. No layout thrash during tile animations. Measure
  with Chrome DevTools before shipping each animation.
- Bundle size: < 250kb gzipped (code split: lobby and game loaded separately)

### Responsiveness
- Minimum supported: 375px wide (iPhone SE)
- Breakpoints:
  - Mobile (375–767px): single-column layout, trick area scales down, hand scrolls horizontally
  - Tablet (768–1023px): full compass layout at reduced size
  - Desktop (1024px+): full layout with sidebar for scorecard and log

### Accessibility
- All interactive elements reachable by keyboard
- Tile selection: keyboard navigable (arrow keys through hand, Enter to select/play)
- `prefers-reduced-motion` respected (see Animation section)
- ARIA labels on all game actions
- Color is never the only indicator of legal/illegal tiles (dimming opacity + border change)

### Browser support
- Last 2 versions of Chrome, Firefox, Safari, Edge
- iOS Safari 16+, Android Chrome

---

## 11. Development Phases

### Phase 1 — Single Player (8–10 weeks)
The goal is a complete, polished single-player game that the engine already proves works.

| Week | Milestone |
|---|---|
| 1 | Monorepo setup. Vite + React shell. Socket.IO server (localhost). Game room that plays engine against AI for all 4 seats. |
| 2 | DominoTile SVG component (all states). Table layout (compass). Static hand display. |
| 3 | Bidding UI fully wired. Trump declaration UI with preview. |
| 4 | Play phase: legal tile highlighting, selection, confirm flow. Trick area updates live. |
| 5 | Animations: deal, play, trick resolve, count float, score. |
| 6 | Scorecard ("ALL" letterform), game over screen, between-hand transition. |
| 7 | AI improvements: void tracking, better play heuristics. |
| 8 | Mobile layout. Keyboard accessibility. Reduced motion. |
| 9 | End-to-end test pass. Bug fixes. Performance audit (bundle size, 60fps animations). |
| 10 | Deploy to production. |

### Phase 2 — Multiplayer (6–8 weeks after Phase 1)
Phase 1's architecture already supports this — it's additive, not a rewrite.

| Week | Milestone |
|---|---|
| 1–2 | Auth (guest + accounts). Lobby API (create/list/join rooms). Database schema + Prisma. |
| 3 | Lobby UI. Room list, create room, join by code. |
| 4 | Reconnection handling. Turn timer. AI for empty seats. |
| 5 | Multiplayer test pass (4-human game end-to-end). |
| 6 | Game variants (Nel-O, Plunge). Post-hand chat. Rematch. |
| 7 | Spectator mode. Player stats page. |
| 8 | Load testing. Redis Pub/Sub for multi-instance. Deploy. |

---

## 12. Open Questions (Decide Before Design Kickoff)

1. **Guest vs. account-required?** Phase 1 can be fully anonymous. Does Phase 2 require an account, or allow guest multiplayer with a join code?
2. **Scoring display:** Traditional "ALL" letterform (7 segments), or a numerical marks counter, or both? The designer needs to know.
3. **Game variants in Phase 1?** Nel-O is popular. Worth including in Phase 1 or strictly Phase 2?
4. **Sound?** Click sounds, deal shuffle, trick-win — yes or no? Needs an audio asset pipeline if yes.
5. **Mobile-first or desktop-first?** The compass layout is challenging on small screens. What's the primary device target for launch?
6. **Indicating toggles?** Show/hide the optional partner-signaling behavior in the UI?
7. **Dark mode only, or light + dark?** Texas 42 has a natural "card table felt" dark aesthetic, but some players prefer light.
