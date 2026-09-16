export type ComparisonStatus =
  | "new"
  | "up"
  | "down"
  | "same";


export function getPercentChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return (
    (current - previous) /
    previous
  ) * 100;
}


export function getComparisonStatus(
  change: number | null
): ComparisonStatus {
  if (change === null) {
    return "new";
  }

  if (change > 0) {
    return "up";
  }

  if (change < 0) {
    return "down";
  }

  return "same";
}