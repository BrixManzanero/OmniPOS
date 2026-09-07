import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  AnalyticsOverview,
} from "@/services/api";

import {
  formatPeso,
} from "@/utils/formatters";

import {
  getPercentChange,
} from "../utils/comparison";

import {
  ComparisonBadge,
} from "./ComparisonBadge";


type Props = {
  analytics: AnalyticsOverview;
};


type SegmentKey =
  keyof AnalyticsOverview["segments"];


type SegmentRow = {
  name: string;

  currentOrders: number;
  currentRevenue: number;

  previousOrders: number;
  previousRevenue: number;

  orderChangePercent: number | null;
  revenueChangePercent: number | null;
};


const SEGMENTS: {
  key: SegmentKey;
  name: string;
}[] = [
  {
    key: "pos_walkin",
    name: "POS Walk-in",
  },
  {
    key: "pos_registered",
    name: "POS Registered",
  },
  {
    key: "online_guest",
    name: "Online Guest",
  },
  {
    key: "online_registered",
    name: "Online Registered",
  },
];


function CustomerSegmentsChart({
  analytics,
}: Props) {
  const compare =
    analytics.period !== "today";


  const data: SegmentRow[] =
    SEGMENTS.map(
      ({ key, name }) => {
        const current =
          analytics.segments[key];

        const previous =
          analytics.previous_segments[key];

        return {
          name,

          currentOrders:
            current.orders,

          currentRevenue:
            current.revenue,

          previousOrders:
            previous.orders,

          previousRevenue:
            previous.revenue,

          orderChangePercent:
            getPercentChange(
              current.orders,
              previous.orders
            ),

          revenueChangePercent:
            getPercentChange(
              current.revenue,
              previous.revenue
            ),
        };
      }
    );


  return (
    <section className="analytics-segment-section">
      <div className="analytics-section-heading">
        <div>
          <p className="page-eyebrow">
            Customer Segments
          </p>

          <h2>
            Customer Mix
          </h2>

          <p>
            {compare
              ? "Compare customer activity with the previous equivalent period."
              : "Customer activity recorded today across physical and online channels."}
          </p>
        </div>
      </div>


      <div className="analytics-segment-card">
        <ResponsiveContainer
          width="100%"
          height={360}
        >
          <BarChart
            data={data}
            layout="vertical"
            barGap={4}
            barCategoryGap="24%"
            margin={{
              top: 12,
              right: 35,
              left: 25,
              bottom: 12,
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
              width={130}
              tickLine={false}
              axisLine={false}
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

                const segment =
                  payload[0]
                    .payload as SegmentRow;

                return (
                  <div className="analytics-chart-tooltip">
                    <strong>
                      {segment.name}
                    </strong>

                    <span>
                      {compare
                        ? "Current Orders"
                        : "Orders"}
                      :{" "}
                      {segment.currentOrders}
                    </span>

                    <span>
                      {compare
                        ? "Current Revenue"
                        : "Revenue"}
                      :{" "}
                      {formatPeso(
                        segment.currentRevenue
                      )}
                    </span>

                    {compare && (
                      <>
                        <span>
                          Previous Orders:{" "}
                          {segment.previousOrders}
                        </span>

                        <span>
                          Previous Revenue:{" "}
                          {formatPeso(
                            segment.previousRevenue
                          )}
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
              dataKey="currentOrders"
              name={
                compare
                  ? "Current Period"
                  : "Today"
              }
              fill="#2F80ED"
              radius={[0, 6, 6, 0]}
              maxBarSize={
                compare ? 22 : 34
              }
            />

            {compare && (
              <Bar
                dataKey="previousOrders"
                name="Previous Period"
                fill="#B9D7F5"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
              />
            )}
          </BarChart>
        </ResponsiveContainer>


        <div className="analytics-segment-comparison-list">
          {data.map((segment) => (
            <div
              key={segment.name}
              className="analytics-segment-comparison-row"
            >
              <div className="analytics-segment-comparison-header">
                <strong>
                  {segment.name}
                </strong>

                {compare && (
                  <div>
                    <span>
                      Orders{" "}
                      <ComparisonBadge
                        value={
                          segment.orderChangePercent
                        }
                      />
                    </span>

                    <span>
                      Revenue{" "}
                      <ComparisonBadge
                        value={
                          segment.revenueChangePercent
                        }
                      />
                    </span>
                  </div>
                )}
              </div>


              <div
                className={`analytics-segment-comparison-values${
                  compare
                    ? ""
                    : " analytics-segment-current-only"
                }`}
              >
                <div>
                  <span>
                    {compare
                      ? "Current"
                      : "Today"}
                  </span>

                  <strong>
                    {segment.currentOrders} orders
                  </strong>

                  <small>
                    {formatPeso(
                      segment.currentRevenue
                    )}
                  </small>
                </div>

                {compare && (
                  <div>
                    <span>
                      Previous
                    </span>

                    <strong>
                      {segment.previousOrders} orders
                    </strong>

                    <small>
                      {formatPeso(
                        segment.previousRevenue
                      )}
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export default CustomerSegmentsChart;