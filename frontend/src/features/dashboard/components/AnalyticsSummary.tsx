import { formatPeso } from "@/utils/formatters";

type Props = {
  sevenDaySales: number;
  sevenDayOrders: number;
  averageOrderValue: number;
};

function AnalyticsSummary({
  sevenDaySales,
  sevenDayOrders,
  averageOrderValue,
}: Props) {
  return (
    <div className="analytics-summary-grid">
      <div className="analytics-summary-card">
        <span>7-Day Revenue</span>

        <strong>
          {formatPeso(sevenDaySales)}
        </strong>

        <small>Total recorded revenue</small>
      </div>

      <div className="analytics-summary-card">
        <span>7-Day Orders</span>

        <strong>
          {sevenDayOrders}
        </strong>

        <small>Completed transactions</small>
      </div>

      <div className="analytics-summary-card">
        <span>Average Order Value</span>

        <strong>
          {formatPeso(averageOrderValue)}
        </strong>

        <small>Revenue per transaction</small>
      </div>
    </div>
  );
}

export default AnalyticsSummary;