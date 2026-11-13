import {
  bidMarks,
  bidTarget,
  countValue,
  otherTeam,
  SEAT_TEAM,
  TOTAL_POINTS,
  type HandResult,
  type HighBid,
  type PlayedDomino,
  type Team,
  type Trick,
} from '@texas42/shared';

/** Points a completed trick is worth: 1 for the trick plus its count tiles. */
export function trickPoints(plays: readonly PlayedDomino[]): number {
  return 1 + plays.reduce((sum, p) => sum + countValue(p.domino), 0);
}

/** Total points captured by each team across the completed tricks. */
export function tallyPoints(tricks: readonly Trick[]): Record<Team, number> {
  const points: Record<Team, number> = { us: 0, them: 0 };
  for (const trick of tricks) {
    if (trick.winner === null) continue;
    points[SEAT_TEAM[trick.winner]] += trick.points;
  }
  return points;
}

/** Tricks won by each team. */
export function tallyTricks(tricks: readonly Trick[]): Record<Team, number> {
  const won: Record<Team, number> = { us: 0, them: 0 };
  for (const trick of tricks) {
    if (trick.winner === null) continue;
    won[SEAT_TEAM[trick.winner]] += 1;
  }
  return won;
}

/**
 * Resolve a completed hand against the winning bid: whether it was made, which
 * team earns marks, and how many.
 */
export function scoreHand(
  winningBid: HighBid,
  trump: NonNullable<HandResult['trump']>,
  tricks: readonly Trick[],
): HandResult {
  const points = tallyPoints(tricks);
  const tricksWon = tallyTricks(tricks);
  const bidTeam = SEAT_TEAM[winningBid.seat];
  const target = bidTarget(winningBid.bid);

  // Mark bids require sweeping all 42 points; points bids need the target.
  const made =
    winningBid.bid.kind === 'marks'
      ? points[bidTeam] === TOTAL_POINTS
      : points[bidTeam] >= target;

  const winTeam = made ? bidTeam : otherTeam(bidTeam);
  const marksAwarded = bidMarks(winningBid.bid);

  return {
    made,
    bidTeam,
    winTeam,
    marksAwarded,
    points,
    tricksWon,
    bid: winningBid.bid,
    trump,
  };
}
