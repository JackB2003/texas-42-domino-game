import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import {
  ClientEvent,
  countValue,
  ServerEvent,
  type Bid,
  type Domino,
  type HandResult,
  type PlayedDomino,
  type PlayerView,
  type Seat,
  type Trump,
} from '@texas42/shared';
import { createGame } from '../lib/api.js';
import { SERVER_URL, SOCKET_PATH } from '../lib/config.js';
import { useGameStore } from './gameStore.js';
import { useUIStore } from './uiStore.js';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface SocketStore {
  socket: Socket | null;
  gameId: string | null;
  status: ConnectionStatus;
  error: string | null;

  connect: () => Promise<void>;
  newGame: () => Promise<void>;

  placeBid: (bid: Bid) => void;
  declareTrump: (trump: Trump) => void;
  playDomino: (domino: Domino) => void;
  readyNextHand: () => void;
}

function wireHandlers(socket: Socket): void {
  const game = useGameStore.getState();
  const ui = useUIStore.getState();

  socket.on(ServerEvent.GameView, (view: PlayerView) => {
    game.setView(view);
    if (view.phase !== 'dealing') ui.endDealing();
    if (!(view.phase === 'playing' && view.turn === 0)) {
      useUIStore.getState().selectDomino(null);
    }
  });

  socket.on(ServerEvent.Dealing, ({ handNo }: { handNo: number }) => {
    useUIStore.getState().startDealing(handNo);
  });

  socket.on(ServerEvent.PlayerPlayed, ({ seat, domino }: { seat: Seat; domino: Domino }) => {
    const value = countValue(domino);
    if (value > 0) useUIStore.getState().addCountFloat(seat, value);
  });

  socket.on(
    ServerEvent.TrickResolved,
    (payload: { winner: Seat; points: number; plays: PlayedDomino[] }) => {
      useUIStore.getState().showResolvedTrick(payload);
      setTimeout(() => useUIStore.getState().clearResolvedTrick(), 700);
    },
  );

  socket.on(ServerEvent.HandScored, (_result: HandResult) => {
    // Surfaced via the next GAME_VIEW (phase: handEnd, handResult set).
  });

  socket.on(ServerEvent.ActionRejected, ({ reason }: { reason: string }) => {
    useUIStore.getState().setRejection(reason);
    setTimeout(() => useUIStore.getState().setRejection(null), 2500);
  });
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  gameId: null,
  status: 'idle',
  error: null,

  connect: async () => {
    if (get().status === 'connecting' || get().status === 'connected') return;
    set({ status: 'connecting', error: null });
    try {
      const { gameId } = await createGame();
      const socketOrigin = new URL(SERVER_URL).origin;
      const socket = io(socketOrigin, { path: SOCKET_PATH, transports: ['websocket'] });
      wireHandlers(socket);
      socket.on('connect', () => {
        socket.emit(ClientEvent.JoinGame, { gameId });
        set({ status: 'connected' });
      });
      socket.on('connect_error', (err) => set({ status: 'error', error: err.message }));
      set({ socket, gameId });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Connection failed' });
    }
  },

  newGame: async () => {
    get().socket?.disconnect();
    useGameStore.getState().reset();
    useUIStore.getState().endDealing();
    useUIStore.getState().clearResolvedTrick();
    set({ socket: null, gameId: null, status: 'idle' });
    await get().connect();
  },

  placeBid: (bid) => get().socket?.emit(ClientEvent.PlaceBid, { bid }),
  declareTrump: (trump) => get().socket?.emit(ClientEvent.DeclareTrump, { trump }),
  playDomino: (domino) => get().socket?.emit(ClientEvent.PlayDomino, { domino }),
  readyNextHand: () => get().socket?.emit(ClientEvent.ReadyNextHand),
}));
