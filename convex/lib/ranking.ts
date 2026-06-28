import { Doc } from "../_generated/dataModel";

// The four ranking dimensions a leaderboard can sort by.
export type SortKey = "quality" | "affordability" | "ease" | "speed";

// Higher-is-better for quality/ease; lower-is-better for affordability/speed.
export function sortStats(
  stats: Doc<"toolStats">[],
  sort: SortKey,
): Doc<"toolStats">[] {
  const arr = [...stats];
  switch (sort) {
    case "quality":
      arr.sort((a, b) => b.elo - a.elo);
      break;
    case "affordability":
      arr.sort((a, b) => a.cost - b.cost);
      break;
    case "ease":
      arr.sort((a, b) => b.easeScore - a.easeScore);
      break;
    case "speed":
      arr.sort((a, b) => a.speedMs - b.speedMs);
      break;
  }
  return arr;
}
