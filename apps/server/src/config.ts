export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL,
  socketPath: process.env.SOCKET_PATH ?? '/socket.io/',
};

export interface Timing {
  deal: number;
  thinkBid: number;
  thinkTrump: number;
  thinkPlay: number;
  trickHold: number;
  scoreDelay: number;
}

/** Server-driven pacing (ms). Mirrors the design's reveal cadence. */
export const TIMING: Timing = {
  deal: 2700,
  thinkBid: 700,
  thinkTrump: 800,
  thinkPlay: 650,
  trickHold: 900,
  scoreDelay: 600,
};
