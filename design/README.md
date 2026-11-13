# Handoff: JB Texas 42 — Game Table

## Overview
A single-player-perspective game table UI for **Texas 42**, the classic four-player partnership domino trick-taking game. The screen shows the full round lifecycle: a shuffle-and-deal sequence, bidding, declaring trump, playing tricks (with animated tile movement to the center), a running scoreboard/HUD, a trick-history rail, and end-of-hand / game-over summaries.

The seating is fixed from the local player's point of view: **You** (bottom), **Willie · partner** (top), **Uncle Si** (left opponent), **Bobby** (right opponent). You + partner = "your team"; the two opponents = "other team".

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that demonstrate the intended look, layout, and animation behavior. They are **not production code to copy directly**.

The HTML uses a small in-house templating runtime (`support.js`, the `<x-dc>` / `<dc-import>` / `<sc-for>` / `<sc-if>` tags). **Do not port the runtime.** The task is to **recreate these designs in the target codebase's environment** (React, Vue, SwiftUI, native, etc.) using its established component patterns, state management, and animation tools. If no environment exists yet, pick the most appropriate framework and implement there. Treat the `.dc.html` logic class only as a reference for game/state behavior, not as code to keep.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, sizing, and animation timings are all specified below and are intended to be matched closely. The game logic in the prototype is **scripted/illustrative** (a fixed opponent script, a fixed dealt hand) so the flow can be demoed — the real implementation must supply actual Texas 42 rules, shuffling, dealing, legal-play validation, trick resolution, and scoring.

---

## Screens / Views

The design is one persistent table screen (1280 × 800, fixed) with five overlay states layered on top. Base layer is always the table; overlays appear by game phase.

### Base table layout (1280 × 800)
- **Background:** dark green felt — `background-color:#16352b` with `radial-gradient(ellipse 85% 75% at 50% 36%, #2c6450 0%, #1c4538 48%, #0e2620 100%)`.
- **Font:** `'Libre Franklin'` (weights 400–800) for all UI; `'Rye'` (serif, display) for the logo wordmark and overlay flavor headers.
- **Top HUD bar:** full width, height 86px, `linear-gradient(180deg,#0d1a15,#070f0b)`, `border-bottom:2px solid rgba(61,111,180,.4)`, z-index 20. Contains (left→right): logo, spacer, Your-Team marks card, Other-Team marks card, Hand-Points progress bar, and a Bid/Trump/Won-By info card.
- **Trick-history rail:** right side, `top:100px; right:14px; bottom:14px; width:240px`, `background:rgba(0,0,0,.36)`, `border-radius:14px`, z-index 10. Vertical list of 7 trick cards.
- **Four seats** positioned around the table (see Components).
- **Center trick area:** anchored at screen point ~`(x:507, y:435)` — a 214×198 zone holding the four played tiles (partner top, left/right sides rotated 90°, you bottom) plus a small dark center hub. Below it, a status pill: `Trick {n} of 7 · Trump: {trump} · tap a tile to play`.
- **Your hand:** bottom center (`left:507px; bottom:18px; translateX(-50%)`), a row of up to 7 large tappable dominoes.

### Overlay: Shuffle & Deal  (phase `dealing`)
Transient, ~2.7s, z-index 55, `pointer-events:none`. Plays at the start of every hand and on new game. See Interactions.

### Overlay: Bidding  (phase `bid`)
- Dimmer: `rgba(8,20,15,.32)` (intentionally **light** so the player's own tiles remain visible behind it), z-index 60.
- Modal: 600px wide, `linear-gradient(180deg,#241910,#170f08)`, `border:1.5px solid rgba(61,111,180,.5)`, `border-radius:18px`, `padding:28px 32px`, `box-shadow:0 24px 60px rgba(0,0,0,.6)`.
- Contents: `Hand {n}` flavor line (Rye, `#E8a06a`), "Bidding" title (700/26px/#fff), a row of 3 opponent bid-status chips, a "YOUR BID · must beat 30" label, a wrap of bid buttons (31–42, "1 Mark", "2 Marks"), and a full-width "Pass" button.

### Overlay: Declare Trump  (phase `trump`)
- Same light dimmer `rgba(8,20,15,.32)` and modal styling, 560px wide.
- Header: `You won the bid with {bid}` (Rye), "Declare trump" title. A wrap of 9 trump buttons: Blanks, Ones, Twos, Threes, Fours, Fives, Sixes, Doubles, Follow Me.

### Overlay: Hand Complete  (phase `handEnd`)
- Dimmer `rgba(8,20,15,.78)`, modal 560px, border colored by result.
- Shows `Hand {n} complete`, a big verdict — **BID MADE** (`#46C97E`) or **SET** (`#FF6A5E`), the bid line (`{team} bid {bid} on {trump} — scored {pts}`), two team point cards (Your team box tinted blue, Other team box tinted gold), a marks line (`+{n} mark(s) to {team} · now {us}–{them}`), and a "Deal next hand →" button.

### Overlay: Game Over  (phase `gameOver`)
- Dimmer `rgba(8,20,15,.85)`, modal 520px, border colored by winner.
- Shows "JB Texas 42" (Rye), "Game Over" (800/44px), `{team} win` in the winner's color, `Final marks {us} – {them}`, and a "New game" button. Triggered when either team reaches 7 marks.

---

## Components (exact specs)

### Logo (HUD, top-left)
- 58×58 circle, `radial-gradient(circle at 35% 28%, #E05B4D, #C0392B)`, `box-shadow:0 4px 10px rgba(0,0,0,.5)`.
- Inside: `JB` in Rye 20px, color `#F4E9D6`, `text-shadow:1.5px 1.5px 0 #234A82`.
- Wordmark to the right: line 1 `JB` (Rye 16px #fff); line 2 `TEXAS 42` (Libre Franklin 700/9px, `#E8a06a`, letter-spacing 2px).

### Team marks cards (HUD)
- **Your team:** `linear-gradient(180deg,#5A89CE,#3D6FB4)`, radius 11px, min-width 124px. Label "YOUR TEAM", value `{marks}/7` (800/20px). Row of 7 segment bars (height 9px, radius 5px); filled = `#fff`, empty = `rgba(255,255,255,.28)`.
- **Other team:** `linear-gradient(180deg,#D4A235,#BF8F2A)`, otherwise identical. Label "OTHER TEAM".

### Hand-points progress bar (HUD)
- Header row: "HAND POINTS" left, "{counted} OF 42" right (both 600/9px, `#e8d9bf`).
- Bar: height 20px, radius 7px, black track. Left fill width = `{usPct}` on `#3D6FB4` showing `{pointsUs}`; remaining flex on `#BF8F2A` showing `{pointsThem}` (right-aligned). Each number 800/13px #fff. `usPct` = `round(pointsUs / (pointsUs+pointsThem) * 100)%`, or `50%` when zero.

### Bid/Trump/Won-By card (HUD, far right)
- `background:rgba(255,255,255,.06)`, `border:1px solid rgba(61,111,180,.5)`, radius 11px. Three labeled values separated by thin dividers: **BID** (`#3D6FB4`-family accent `#79A6E2`? actual: value uses `#E0705E`→now blue family — displayed in accent), **TRUMP**, **WON BY**. Labels 600/8px `#9a8a72`; values `#e8d9bf` (BID value larger, 800/19px).

### Seats
Each seat = circular avatar + name chip + a fan of face-down tiles.
- **Partner (Willie), top:** `top:104px; left:507px; translateX(-50%)`. Avatar 50px, `linear-gradient(135deg,#caa07a,#9c6f49)`, `border:3px solid #C0392B`, initial "W". Fan of 7 face-down dominoes (w=21) to the right of avatar. Chip "Willie · partner" on `#C0392B`.
- **Left opponent (Uncle Si):** `left:24px; top:312px`, column. Avatar 50px, `linear-gradient(135deg,#8aa0b4,#5d7488)`, `border:3px solid #2E9079`, "Si". Chip "Uncle Si" on `#BF8F2A`. Fan of 7 face-down (w=19) below; caption "{n} left".
- **Right opponent (Bobby):** `left:836px; top:312px`, mirror of left. Avatar gradient `linear-gradient(135deg,#b48a8a,#885d5d)`, "Bo". Chip "Bobby" on `#BF8F2A`.
- **You, bottom:** avatar 54px, `linear-gradient(135deg,#e3a06a,#c0703a)`, `border:3px solid #C0392B`, "You". Status chip below it: text + bg change by turn — `Your turn`/`#3D6FB4` when it's your move, `Playing…`/`#8a6a3a`, else `Waiting…`/`#6b5d49`.

### Domino tile (core reusable component)
- Aspect ratio **1 : 1.92** (height = round(width × 1.92)). `border-radius:9px`.
- **Face-up tile:** `linear-gradient(160deg,#FBF7EA,#ECE2C8)`, `border:1px solid rgba(120,100,60,.4)`, `box-shadow:0 3px 5px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.7)`. Two 3×3 pip grids (top half / bottom half) split by a divider bar (`height:2px; background:rgba(95,72,40,.4); margin:0 11%`). Pip dot diameter = `max(3, round(width × 0.155))`, grid padding = `round(width × 0.11)`, each dot `border-radius:50%` with `box-shadow:inset 0 -1px 1.5px rgba(0,0,0,.35)`.
- **Pip layout patterns** (cells of the 3×3 grid that are "on", indices 0–8 left-to-right, top-to-bottom): 0→none; 1→[4]; 2→[2,6]; 3→[2,4,6]; 4→[0,2,6,8]; 5→[0,2,4,6,8]; 6→[0,2,3,5,6,8].
- **Pip colors — standard double-six scheme** (this is important, dev should match exactly):
  - 1 = **light blue** `#3FA0E0`
  - 2 = **green** `#2E8B57`
  - 3 = **red** `#CB3B33`
  - 4 = **brown** `#8A5A2B`
  - 5 = **dark blue** `#1E3A8A`
  - 6 = **yellow** `#E0A800`
  - 0 (blank) = no pips
- **Trump glow:** when a tile is a trump tile, add `box-shadow: …, 0 0 0 3px #F5A623, 0 0 16px #F5A623` (gold halo) on top of the base shadow.
- **Face-down tile:** same outer tile; inner panel 72%×84%, `linear-gradient(160deg,#F1E9D2,#E0D3B2)`, `box-shadow:inset 0 1px 2px rgba(255,255,255,.65), inset 0 -1px 2px rgba(120,100,60,.3)`.
- Tile widths used: hand = 62, center-played = 42, partner fan = 21, opponent fans = 19, rail tiles = 20, deal/shuffle tiles = 46.

### Trick-history rail cards (7)
- Played card: `background:rgba(255,255,255,.05)`, `border:1.5px solid {teamColor}`, radius 10px. Header "Trick {n}" + a `+{pts}` badge on team color. The 4 plays shown as tiny dominoes (w=20), the trick-winner's tile carries the team-color glow. Footer: dot + "{winner} won the trick".
- Pending card: dashed `rgba(255,255,255,.14)` border, "Trick {n} · not played".
- `teamColor` = `#3D6FB4` (your team) or `#BF8F2A` (other team).

### Buttons
- **Bid / Trump buttons:** `background:rgba(61,111,180,.16)`, `border:1.5px solid rgba(61,111,180,.55)`, radius 9px, text in blue accent, 700/14px. Hover: `background:#3D6FB4; color:#fff`.
- **Pass button:** `background:rgba(255,255,255,.06)`, `border:1px solid rgba(255,255,255,.18)`, text `#cdbfa8`. Hover lighter.
- **Deal next / New game:** solid `#3D6FB4`, white text. Hover `#5A89CE`.

---

## Interactions & Behavior

### Shuffle & Deal animation (start of every hand + new game)
1. Phase enters `dealing`. The four seat fans and your hand are rendered **empty** during this phase (so the deal visibly fills them).
2. A stack of 5 fanned face-down dominoes (w=46) sits at the trick-center `(507,435)` and **shuffles**: a `shuffle` keyframe (`translate/rotate` jiggle) running `.24s ease-in-out`, 5 iterations, `alternate` (~1.2s total). After it, the pile fades out (`pileOut`, `.4s ease`, delay `1.15s`).
3. 28 face-down tiles (7 × 4 players) fly out from the center to the seats in **turn order** (you → left → partner → right, repeated 7 rounds). Each tile uses keyframe `dealOut .5s cubic-bezier(.3,.65,.3,1)` with staggered `animation-delay = (0.95 + i*0.045)s` for tile index `i`.
   - `dealOut`: `from { opacity:0; transform:translate(0,0) scale(.5) }` → `16% { opacity:1 }` → `to { opacity:1; transform: translate(var(--dx),var(--dy)) scale(.46) }`.
   - Per-seat landing offsets (`--dx,--dy`) from the center origin: **you** `(35px, 285px)`, **left** `(-455px, -25px)`, **partner** `(30px, -300px)`, **right** `(355px, -25px)`.
4. After ~2.7s the phase switches to `bid` and the real seat fans + hand appear.
- A label pill "Shuffling & dealing hand {n}" sits at `top:150px`, centered on x=507.

### Tile-to-center play animation (during trick play)
- When a tile is played it appears in its center slot and animates in **from the direction of the player who played it**:
  - Keyframes `flyPos` (from `translateY(240px) scale(.62)` → rest) and `flyNeg` (from `translateY(-240px)`), each `.44s cubic-bezier(.2,.8,.3,1)`, with a `65% { opacity:1 }` stop.
  - **You** (bottom) → `flyPos`; **partner** (top) → `flyNeg`. **Left** and **right** slots are wrapped in a `rotate(90deg)` container, so left uses `flyPos` and right uses `flyNeg` — the rotation turns the vertical motion into a horizontal slide from that side.
- Timing in the prototype: on your tap, your tile shows immediately; opponents/partner reveal at +450ms (left), +900ms (partner), +1350ms; trick resolves at +2300ms. The real app should drive these from actual turn order.

### Click flows
- Tap a hand tile (only when it's your turn and the center isn't already showing your play) → plays it.
- Bid buttons → set your bid and advance to `trump`. Pass → opponent takes it at 30 and play begins.
- Trump buttons → set trump and begin play.
- "Deal next hand →" → next hand (re-runs deal animation). "New game" → reset marks to 0 and re-deal.

### Hover states
- Hand tiles lift `translateY(-12px)` on hover (`transition:transform .12s ease`).
- All buttons have the hover treatments listed above (`transition:all .12s`).

---

## State Management
State variables used by the prototype (recreate equivalents):
- `phase`: one of `dealing | bid | trump | play | handEnd | gameOver`.
- `marks`: `{ us, them }` — game-level marks, first to 7 wins.
- `handNo`: current hand number.
- `bid`: `{ label, target, marks }` (target points needed; marks awarded on success). `bidWinner` (name), `bidTeam` (`us|them`).
- `trump`: one of Blanks/Ones/Twos/Threes/Fours/Fives/Sixes/Doubles/Follow Me.
- `hand`: array of the local player's tiles `{ t, b }`.
- `trickNo` (1–7), `center`: `{ you, left, partner, right }` currently played tiles, `tricks`: resolved trick records `{ n, won, team, pts, plays[] }`.
- `points`: `{ us, them }` accumulated points this hand (total 42 available).
- `revealing`: lock flag during a trick reveal sequence. `handResult`: end-of-hand summary object.

Transitions: `dealing → bid → trump → play → (7 tricks) → handEnd → dealing(next) …`; or `→ gameOver` when a team hits 7 marks. **Trump determination** (`isTrumpTile`): Doubles trump = `t===b`; Follow Me = no trump; suit trumps = tile contains that suit number on either end.

> Note: the prototype's opponent plays, dealt hand, and trick outcomes are a fixed script for demo purposes. The production app must implement real shuffling, dealing, bidding AI, legal-follow validation, trick winner determination, and 42-point + marks scoring.

## Design Tokens
**Colors**
- Felt bg: `#16352b`, `#2c6450`, `#1c4538`, `#0e2620`
- HUD: `#0d1a15`, `#070f0b`
- Modal: `#241910`, `#170f08`
- Team "us" (blue): primary `#3D6FB4`, light `#5A89CE`, accent `#79A6E2`, pale `#AECBEE`, deep `#234A82`, rgba `rgba(61,111,180,a)`
- Team "them" (gold): primary `#BF8F2A`, light `#D4A235`, pale `#E6C566`, rgba `rgba(212,162,53,a)`
- Logo red accents: `#C0392B`, `#E05B4D`
- Verdict: made `#46C97E`, set `#FF6A5E`; trump glow `#F5A623`
- Tile pips (double-six): `#3FA0E0`/`#2E8B57`/`#CB3B33`/`#8A5A2B`/`#1E3A8A`/`#E0A800`
- Tile faces: `#FBF7EA`→`#ECE2C8` (up), `#F1E9D2`→`#E0D3B2` (down)
- Parchment text neutrals: `#e8d9bf`, `#cdbfa8`, `#9a8a72`, `#6b5d49`, `#E8a06a`

**Typography:** `'Libre Franklin'` 400/500/600/700/800; `'Rye'` 400 (display/flavor). Sizes range 8px (HUD micro-labels) → 44px (Game Over title).

**Radii:** tiles 9px; cards/chips 9–14px; modals 18px; pills 9px. **Shadows:** tile `0 3px 5px rgba(0,0,0,.4)`; modal `0 24px 60px rgba(0,0,0,.6)`; cards `0 3px 7px rgba(0,0,0,.3)`.

## Assets
- **Fonts:** Google Fonts — `Rye` and `Libre Franklin`. No image assets; all tiles, avatars, and chrome are rendered with CSS/gradients. Avatar initials (W, Si, Bo, You) are text. No external icons.

## Files
- `Texas 42 Table.dc.html` — the main game table screen (all layout, HUD, seats, center play, overlays, animations, and the demo game-state logic).
- `Domino.dc.html` — the reusable domino tile component (face-up pip rendering, face-down back, trump glow, sizing math, double-six pip colors).
- `Texas 42 Explorations.dc.html` — earlier exploration/concept frames (reference only; not the final design).

> These `.dc.html` files use an in-house template runtime and are **design references**, not the runtime to ship. Recreate the UI and behavior in the target codebase. The HTML/CSS values above are authoritative.
