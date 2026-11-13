import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { ClientEvent, ServerEvent, type Bid, type Domino, type Trump } from '@texas42/shared';
import { config } from './config.js';
import type { GameManager } from './game/GameManager.js';
import type { GameRoom } from './game/GameRoom.js';

export function attachSockets(httpServer: HttpServer, manager: GameManager): Server {
  const io = new Server(httpServer, {
    path: config.socketPath,
    cors: { origin: config.clientOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket: Socket) => {
    let room: GameRoom | null = null;

    socket.on(ClientEvent.JoinGame, ({ gameId }: { gameId: string }) => {
      const found = manager.get(gameId);
      if (!found) {
        socket.emit(ServerEvent.ActionRejected, { reason: 'Game not found.' });
        return;
      }
      room = found;
      room.attach(socket);
      room.start();
    });

    socket.on(ClientEvent.PlaceBid, ({ bid }: { bid: Bid }) => {
      void room?.handleAction({ type: 'PLACE_BID', seat: 0, bid });
    });
    socket.on(ClientEvent.DeclareTrump, ({ trump }: { trump: Trump }) => {
      void room?.handleAction({ type: 'DECLARE_TRUMP', seat: 0, trump });
    });
    socket.on(ClientEvent.PlayDomino, ({ domino }: { domino: Domino }) => {
      void room?.handleAction({ type: 'PLAY_DOMINO', seat: 0, domino });
    });
    socket.on(ClientEvent.ReadyNextHand, () => {
      void room?.handleAction({ type: 'READY_NEXT_HAND', seat: 0 });
    });

    socket.on('disconnect', () => {
      if (room) room.detach(socket);
    });
  });

  return io;
}
