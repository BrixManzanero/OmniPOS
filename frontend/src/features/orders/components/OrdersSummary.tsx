import { formatPeso } from "@/utils/formatters";

type Props = {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
};

function OrdersSummary({
  totalOrders,
  completedOrders,
  totalRevenue,
}: Props) {
  return (
    <div className="analytics-summary-grid">
      <div className="analytics-summary-card">
        <span>Total Orders</span>
        <strong>{totalOrders}</strong>
        <small>All recorded transactions</small>
      </div>

      <div className="analytics-summary-card">
        <span>Completed Orders</span>
        <strong>{completedOrders}</strong>
        <small>Successful transactions</small>
      </div>

      <div className="analytics-summary-card">
        <span>Total Revenue</span>
        <strong>
          {formatPeso(totalRevenue)}
        </strong>
        <small>Revenue from all orders</small>
      </div>
    </div>
  );
}

export default OrdersSummary;