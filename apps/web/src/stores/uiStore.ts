import { create } from 'zustand';
import type { Domino, PlayedDomino, Seat } from '@texas42/shared';

export interface CountFloat {
  id: number;
  seat: Seat;
  value: number;
}

export interface ResolvedTrick {
  winner: Seat;
  points: number;
  plays: PlayedDomino[];
}

interface UIStore {
  /** Tile the human has tapped once (tap again to confirm the play). */
  selectedDomino: Domino | null;
  selectDomino: (d: Domino | null) => void;

  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;

  /** Deal animation state. */
  dealing: boolean;
  dealHandNo: number;
  startDealing: (handNo: number) => void;
  endDealing: () => void;

  /** A just-resolved trick held briefly so it can animate before clearing. */
  resolvedTrick: ResolvedTrick | null;
  showResolvedTrick: (t: ResolvedTrick) => void;
  clearResolvedTrick: () => void;

  /** Transient "+5/+10" floats above a seat when a count tile is played. */
  countFloats: CountFloat[];
  addCountFloat: (seat: Seat, value: number) => void;
  removeCountFloat: (id: number) => void;

  /** A rejected-action message to surface as a toast. */
  rejection: string | null;
  setRejection: (msg: string | null) => void;
}

let countFloatId = 0;

export const useUIStore = create<UIStore>((set) => ({
  selectedDomino: null,
  selectDomino: (d) => set({ selectedDomino: d }),

  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (v) => set({ reducedMotion: v }),

  dealing: false,
  dealHandNo: 1,
  startDealing: (handNo) => set({ dealing: true, dealHandNo: handNo }),
  endDealing: () => set({ dealing: false }),

  resolvedTrick: null,
  showResolvedTrick: (t) => set({ resolvedTrick: t }),
  clearResolvedTrick: () => set({ resolvedTrick: null }),

  countFloats: [],
  addCountFloat: (seat, value) => {
    const id = ++countFloatId;
    set((s) => ({ countFloats: [...s.countFloats, { id, seat, value }] }));
    setTimeout(() => {
      set((s) => ({ countFloats: s.countFloats.filter((f) => f.id !== id) }));
    }, 650);
  },
  removeCountFloat: (id) =>
    set((s) => ({ countFloats: s.countFloats.filter((f) => f.id !== id) })),

  rejection: null,
  setRejection: (msg) => set({ rejection: msg }),
}));
