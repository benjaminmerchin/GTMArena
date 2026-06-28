// Standard Elo. Used by BATTLE votes and by RACE pairwise tournament updates.

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// scoreA ∈ {1 win, 0.5 draw, 0 loss}. Returns [newA, newB].
export function updateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  k = 24,
): [number, number] {
  const expA = expectedScore(ratingA, ratingB);
  const expB = 1 - expA;
  const newA = ratingA + k * (scoreA - expA);
  const newB = ratingB + k * (1 - scoreA - expB);
  return [newA, newB];
}
