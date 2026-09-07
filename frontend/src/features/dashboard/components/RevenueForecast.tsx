import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardAnalytics,
} from "@/services/api";

import {
  formatPeso,
} from "@/utils/formatters";


type ForecastPoint = {
  label: string;
  actual: number | null;
  forecast: number | null;
};


type Props = {
  analytics: DashboardAnalytics | null;
  chartData: ForecastPoint[];
};


function RevenueForecast({
  analytics,
  chartData,
}: Props) {

  function formatYAxis(
    value: number
  ) {

    if (value >= 1000000) {

      return `₱${(
        value / 1000000
      ).toFixed(1)}M`;

    }


    if (value >= 1000) {

      return `₱${(
        value / 1000
      ).toFixed(1)}K`;

    }


    return `₱${value}`;
  }


  return (
    <section className="panel">

      <div className="panel-header">

        <div>

          <h2>
            Revenue Forecast
          </h2>

          <p>
            Actual sales compared with the
            next 7-day estimate.
          </p>

        </div>

      </div>


      {
        !analytics?.forecast_ready && (

          <div className="forecast-warning">

            <strong>
              Early estimate
            </strong>

            <span>
              More historical sales are needed
              before this forecast becomes reliable.
            </span>

          </div>

        )
      }


      <div className="forecast-chart-large">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={chartData}
            margin={{
              top: 12,
              right: 20,
              left: 4,
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
              tickFormatter={
                formatYAxis
              }
              tickLine={false}
              axisLine={false}
              width={70}
            />


            <Tooltip
              formatter={(
                value,
                name
              ) => [
                formatPeso(
                  Number(value ?? 0)
                ),
                name,
              ]}
            />


            <Legend />


            {/* =========================
                ACTUAL SALES
                SOLID + STEADY
            ========================= */}

            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Sales"
              stroke="#2F80ED"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#FFFFFF",
                stroke: "#2F80ED",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#FFFFFF",
                stroke: "#2F80ED",
                strokeWidth: 2,
              }}
              connectNulls={false}
              isAnimationActive={false}
            />


            {/* =========================
                FORECAST
                MOVING DASHED LINE
            ========================= */}

            <Line
              className="analytics-moving-dash-line"
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#7FB3E8"
              strokeWidth={2.4}
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
              connectNulls={false}
              isAnimationActive={false}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>


      <div className="forecast-footer">

        <span>
          Forecast Method
        </span>

        <strong>
          7-Day Baseline Average
        </strong>

      </div>


      <small className="forecast-note">
        {analytics?.forecast_note}
      </small>

    </section>
  );
}


export default RevenueForecast;

