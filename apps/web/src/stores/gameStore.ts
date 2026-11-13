import { create } from 'zustand';
import type { PlayerView } from '@texas42/shared';

interface GameStore {
  /** The latest authoritative view from the server. Never mutated locally. */
  view: PlayerView | null;
  setView: (view: PlayerView) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  view: null,
  setView: (view) => set({ view }),
  reset: () => set({ view: null }),
}));
