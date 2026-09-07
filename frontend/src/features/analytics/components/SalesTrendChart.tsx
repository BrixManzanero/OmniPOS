import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsOverview } from "../types/analytics.types";
import { formatPeso } from "@/utils/formatters";

import {
  buildSalesComparisonData,
  getPeakSalesDay,
  type SalesComparisonRow,
} from "../utils/chartData";


type Props = {
  analytics: AnalyticsOverview;
};


function formatYAxis(value: number) {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(1)}K`;
  }

  return `₱${value}`;
}


function SalesTrendChart({
  analytics,
}: Props) {
  const compare =
    analytics.period !== "today";

  const data =
    buildSalesComparisonData(
      analytics.daily_sales,
      analytics.previous_daily_sales
    );

  const peakDay =
    getPeakSalesDay(
      analytics.daily_sales
    );

  const dailyAverage =
    analytics.days
      ? analytics.total_revenue /
        analytics.days
      : 0;


  return (
    <section className="analytics-trend-section">
      <div className="analytics-section-heading">
        <div>
          <p className="page-eyebrow">
            Sales Performance
          </p>

          <h2>Sales Activity</h2>

          <p>
            {compare
              ? "Compare daily revenue and transaction activity with the previous equivalent period."
              : "Revenue and transaction activity recorded today."}
          </p>
        </div>
      </div>


      <div className="analytics-trend-card">
        <div className="analytics-trend-summary">
          <div>
            <span>
              {compare
                ? "Period Revenue"
                : "Today's Revenue"}
            </span>

            <strong>
              {formatPeso(
                analytics.total_revenue
              )}
            </strong>
          </div>


          <div>
            <span>
              {compare
                ? "Daily Average"
                : "Today's Sales"}
            </span>

            <strong>
              {formatPeso(
                compare
                  ? dailyAverage
                  : analytics.total_revenue
              )}
            </strong>
          </div>


          <div>
            <span>
              {compare
                ? "Peak Day"
                : "Sales Date"}
            </span>

            <strong>
              {peakDay?.label ?? "—"}
            </strong>

            <small>
              {peakDay
                ? formatPeso(
                    peakDay.sales
                  )
                : "No sales"}
            </small>
          </div>
        </div>


        <div className="analytics-trend-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={data}
              barGap={4}
              margin={{
                top: 16,
                right: 18,
                left: 0,
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
                yAxisId="revenue"
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                width={70}
              />

              <YAxis
                yAxisId="orders"
                orientation="right"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={36}
              />


              <Tooltip
                cursor={{
                  fill:
                    "rgba(47, 128, 237, 0.05)",
                }}
                content={({
                  active,
                  payload,
                }) => {
                  if (
                    !active ||
                    !payload?.length
                  ) {
                    return null;
                  }

                  const item =
                    payload[0]
                      .payload as SalesComparisonRow;

                  return (
                    <div className="analytics-chart-tooltip">
                      <strong>
                        {item.label}
                      </strong>

                      <span>
                        {compare
                          ? "Current Revenue"
                          : "Revenue"}
                        :{" "}
                        {formatPeso(
                          item.currentSales
                        )}
                      </span>

                      <span>
                        {compare
                          ? "Current Orders"
                          : "Orders"}
                        :{" "}
                        {item.currentOrders}
                      </span>

                      {compare && (
                        <>
                          <span>
                            Previous Date:{" "}
                            {item.previousDate ??
                              "—"}
                          </span>

                          <span>
                            Previous Revenue:{" "}
                            {formatPeso(
                              item.previousSales
                            )}
                          </span>

                          <span>
                            Previous Orders:{" "}
                            {item.previousOrders}
                          </span>
                        </>
                      )}
                    </div>
                  );
                }}
              />


              {compare && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: 12,
                  }}
                />
              )}


              <Bar
                dataKey="currentSales"
                name={
                  compare
                    ? "Current Revenue"
                    : "Revenue"
                }
                yAxisId="revenue"
                fill="#2F80ED"
                radius={[5, 5, 0, 0]}
                maxBarSize={
                  compare ? 32 : 52
                }
                isAnimationActive={false}
              />


              {compare && (
                <Bar
                  dataKey="previousSales"
                  name="Previous Revenue"
                  yAxisId="revenue"
                  fill="#B9D7F5"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
              )}


              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="currentOrders"
                name={
                  compare
                    ? "Current Orders"
                    : "Orders"
                }
                stroke="#175CD3"
                strokeWidth={2.7}
                dot={{
                  r: 4,
                  fill: "#FFFFFF",
                  stroke: "#175CD3",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#FFFFFF",
                  stroke: "#175CD3",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />


              {compare && (
                <Line
                  className="analytics-moving-dash-line"
                  yAxisId="orders"
                  type="monotone"
                  dataKey="previousOrders"
                  name="Previous Orders"
                  stroke="#7FB3E8"
                  strokeWidth={2.2}
                  strokeDasharray="7 7"
                  strokeLinecap="round"
                  dot={{
                    r: 3,
                    fill: "#FFFFFF",
                    stroke: "#7FB3E8",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#FFFFFF",
                    stroke: "#7FB3E8",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}


export default SalesTrendChart;