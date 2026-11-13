// Live end-to-end smoke test: connect to the running server over real
// websockets, get dealt in, and drive the human seat until a tile is played.
import { io } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

const res = await fetch(`${SERVER}/games`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
const { gameId } = await res.json();
console.log('created game', gameId);

const socket = io(SERVER, { transports: ['websocket'] });
let reachedPlaying = false;
let sawPlayerPlayed = false;
const phases = new Set();

const done = (ok, msg) => {
  console.log(msg);
  socket.close();
  process.exit(ok ? 0 : 1);
};

socket.on('connect', () => socket.emit('JOIN_GAME', { gameId }));
socket.on('PLAYER_PLAYED', () => {
  sawPlayerPlayed = true;
});
socket.on('GAME_VIEW', (view) => {
  phases.add(view.phase);
  if (view.phase === 'playing') reachedPlaying = true;
  if (view.turn !== 0) return;
  if (view.phase === 'bidding') {
    const bid = view.yourLegalBids[0] ?? { kind: 'pass' };
    socket.emit('PLACE_BID', { bid });
  } else if (view.phase === 'trump') {
    socket.emit('DECLARE_TRUMP', { trump: view.yourLegalTrumps[0] });
  } else if (view.phase === 'playing') {
    if (view.yourLegalPlays[0]) socket.emit('PLAY_DOMINO', { domino: view.yourLegalPlays[0] });
  } else if (view.phase === 'handEnd') {
    socket.emit('READY_NEXT_HAND');
  }
});

setTimeout(() => {
  console.log('phases seen:', [...phases].join(', '));
  done(
    reachedPlaying && sawPlayerPlayed,
    reachedPlaying && sawPlayerPlayed
      ? 'PASS: reached playing phase and tiles were played'
      : 'FAIL: did not reach playing / no plays',
  );
}, 25000);
