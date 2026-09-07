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

function SalesChart({ analytics }: Props) {
  const data = analytics?.sales_last_7_days ?? [];

  function formatYAxis(value: number) {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `₱${(value / 1000).toFixed(1)}K`;
    }

    return `₱${value}`;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="page-eyebrow">Sales Performance</p>

          <h2>Sales — Last 7 Days</h2>

          <p>
            Daily revenue recorded through OmniPOS.
          </p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 18,
              left: 6,
              bottom: 4,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tickFormatter={formatYAxis}
              tickLine={false}
              axisLine={false}
              width={70}
            />

            <Tooltip
              cursor={{ fill: "rgba(47, 128, 237, 0.08)" }}
              formatter={(value) => [
                formatPeso(Number(value ?? 0)),
                "Revenue",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />

            <Bar
              dataKey="sales"
              fill="#2F80ED"
              radius={[6, 6, 0, 0]}
              maxBarSize={52}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default SalesChart;