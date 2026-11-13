import type { Seat } from '@texas42/shared';

export interface SeatVisual {
  initials: string;
  avatar: number;
  gradient: string;
  border: string;
  chipBg: string;
}

/** Per-seat avatar styling, matching the design's four characters. */
export const SEAT_VISUAL: Record<Seat, SeatVisual> = {
  0: {
    initials: 'You',
    avatar: 54,
    gradient: 'linear-gradient(135deg,#e3a06a,#c0703a)',
    border: '#3D6FB4',
    chipBg: '#3D6FB4',
  },
  1: {
    initials: 'Si',
    avatar: 50,
    gradient: 'linear-gradient(135deg,#8aa0b4,#5d7488)',
    border: '#D4A235',
    chipBg: '#BF8F2A',
  },
  2: {
    initials: 'W',
    avatar: 50,
    gradient: 'linear-gradient(135deg,#caa07a,#9c6f49)',
    border: '#3D6FB4',
    chipBg: '#3D6FB4',
  },
  3: {
    initials: 'Bo',
    avatar: 50,
    gradient: 'linear-gradient(135deg,#b48a8a,#885d5d)',
    border: '#D4A235',
    chipBg: '#BF8F2A',
  },
};
