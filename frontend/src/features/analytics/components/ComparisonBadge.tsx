import {
  getComparisonStatus,
} from "../utils/comparison";


type Props = {
  value: number | null;
};


export function ComparisonBadge({
  value,
}: Props) {
  const status =
    getComparisonStatus(value);


  if (status === "new") {
    return (
      <span className="metric-comparison-new">
        New
      </span>
    );
  }


  if (status === "same") {
    return (
      <span className="metric-comparison-neutral">
        No change
      </span>
    );
  }


  const isUp =
    status === "up";


  return (
    <span
      className={
        isUp
          ? "metric-comparison-up"
          : "metric-comparison-down"
      }
    >
      {isUp ? "↑" : "↓"}{" "}
      {Math.abs(value ?? 0).toFixed(1)}%
    </span>
  );
}