import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardAnalytics } from "@/services/api";
import { formatPeso } from "@/utils/formatters";

type Props = {
  analytics: DashboardAnalytics | null;
};

function TopProductsChart({
  analytics,
}: Props) {
  const products =
    analytics?.top_products ?? [];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Top Products</h2>

          <p>
            Best-selling products by quantity.
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <>
          <div className="top-products-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={products}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  cursor={false}
                  formatter={(value) => [
                    `${Number(value ?? 0)} sold`,
                    "Quantity",
                  ]}
                />

                <Bar
                  dataKey="quantity"
                  fill="#2F80ED"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="product-revenue-list">
            {products.map(
              (product, index) => (
                <div
                  key={product.name}
                  className="product-revenue-row"
                >
                  <div>
                    <span className="rank">
                      {index + 1}
                    </span>

                    <div>
                      <strong>
                        {product.name}
                      </strong>

                      <small>
                        {product.quantity} sold
                      </small>
                    </div>
                  </div>

                  <strong>
                    {formatPeso(product.revenue)}
                  </strong>
                </div>
              )
            )}
          </div>
        </>
      ) : (
        <p className="muted-text">
          No sales data yet.
        </p>
      )}
    </section>
  );
}

export default TopProductsChart;