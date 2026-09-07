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


type ProductRow = {
  name: string;
  currentQuantity: number;
  currentRevenue: number;
  previousQuantity: number;
  previousRevenue: number;
  changePercent: number | null;
};


function TopProductsChart({
  analytics,
}: Props) {
  const compare =
    analytics.period !== "today";

  const previousByName =
    new Map(
      analytics.previous_top_products.map(
        (product) => [
          product.name,
          product,
        ]
      )
    );

  const data: ProductRow[] =
    analytics.top_products.map(
      (product) => {
        const previous =
          previousByName.get(
            product.name
          );

        const previousQuantity =
          previous?.quantity ?? 0;

        return {
          name: product.name,

          currentQuantity:
            product.quantity,

          currentRevenue:
            product.revenue,

          previousQuantity,

          previousRevenue:
            previous?.revenue ?? 0,

          changePercent:
            getPercentChange(
              product.quantity,
              previousQuantity
            ),
        };
      }
    );


  return (
    <section className="analytics-products-section">
      <div className="analytics-section-heading">
        <div>
          <p className="page-eyebrow">
            Product Performance
          </p>

          <h2>
            Top Products
          </h2>

          <p>
            {compare
              ? "Compare best-selling products with the previous equivalent period."
              : "Best-selling products recorded today."}
          </p>
        </div>
      </div>


      <div className="analytics-products-card">
        {data.length === 0 ? (
          <div className="analytics-empty-chart">
            No product sales found for this period.
          </div>
        ) : (
          <>
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
                  right: 40,
                  left: 30,
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
                  width={140}
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

                    const product =
                      payload[0]
                        .payload as ProductRow;

                    return (
                      <div className="analytics-chart-tooltip">
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {compare
                            ? "Current Units"
                            : "Units Sold"}
                          :{" "}
                          {product.currentQuantity}
                        </span>

                        <span>
                          {compare
                            ? "Current Revenue"
                            : "Revenue"}
                          :{" "}
                          {formatPeso(
                            product.currentRevenue
                          )}
                        </span>

                        {compare && (
                          <>
                            <span>
                              Previous Units:{" "}
                              {product.previousQuantity}
                            </span>

                            <span>
                              Previous Revenue:{" "}
                              {formatPeso(
                                product.previousRevenue
                              )}
                            </span>

                            <span>
                              Change:{" "}
                              {product.changePercent === null
                                ? "New"
                                : `${product.changePercent >= 0
                                    ? "+"
                                    : ""
                                  }${product.changePercent.toFixed(
                                    1
                                  )}%`}
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
                  dataKey="currentQuantity"
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
                    dataKey="previousQuantity"
                    name="Previous Period"
                    fill="#B9D7F5"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>


            <div className="analytics-product-comparison-list">
              {data.map((product) => (
                <div
                  key={product.name}
                  className="analytics-product-comparison-row"
                >
                  <div className="analytics-product-comparison-name">
                    <strong>
                      {product.name}
                    </strong>

                    {compare && (
                      <ComparisonBadge
                        value={
                          product.changePercent
                        }
                      />
                    )}
                  </div>


                  <div
                    className={`analytics-product-comparison-values${
                      compare
                        ? ""
                        : " analytics-product-current-only"
                    }`}
                  >
                    <div>
                      <span>
                        {compare
                          ? "Current"
                          : "Today"}
                      </span>

                      <strong>
                        {product.currentQuantity} units
                      </strong>

                      <small>
                        {formatPeso(
                          product.currentRevenue
                        )}
                      </small>
                    </div>


                    {compare && (
                      <div>
                        <span>
                          Previous
                        </span>

                        <strong>
                          {product.previousQuantity} units
                        </strong>

                        <small>
                          {formatPeso(
                            product.previousRevenue
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}


export default TopProductsChart;