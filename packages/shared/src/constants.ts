import type { Seat, Team, Trump } from './types.js';

export const SEATS: readonly Seat[] = [0, 1, 2, 3];

/** Seat identities, matching the design (You / Uncle Si / Willie / Bobby). */
export const SEAT_NAMES: Record<Seat, string> = {
  0: 'You',
  1: 'Uncle Si',
  2: 'Willie',
  3: 'Bobby',
};

/** Partnerships: seats 0 + 2 are "us", seats 1 + 3 are "them". */
export const SEAT_TEAM: Record<Seat, Team> = {
  0: 'us',
  2: 'us',
  1: 'them',
  3: 'them',
};

/** The minimum opening bid in Texas 42. */
export const MIN_BID = 30;

/** The maximum points-only bid; 42 is expressed as a 1-mark contract. */
export const MAX_POINTS_BID = 41;

/** Total points available in a hand (35 count + 7 tricks). */
export const TOTAL_POINTS = 42;

/** Marks required to win the game. */
export const MARKS_TO_WIN = 7;

/** Trump declarations in display order (matches the design's 9 buttons). */
export const TRUMP_OPTIONS: readonly Trump[] = [
  'Blanks',
  'Ones',
  'Twos',
  'Threes',
  'Fours',
  'Fives',
  'Sixes',
  'Doubles',
  'Follow Me',
];

/** Maps a number-suit trump to its pip value; null for Doubles / Follow Me. */
export const TRUMP_SUIT_NUMBER: Record<Trump, number | null> = {
  Blanks: 0,
  Ones: 1,
  Twos: 2,
  Threes: 3,
  Fours: 4,
  Fives: 5,
  Sixes: 6,
  Doubles: null,
  'Follow Me': null,
};

export function otherTeam(team: Team): Team {
  return team === 'us' ? 'them' : 'us';
}
