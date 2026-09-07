import type {
  AnalyticsOverview,
} from "../types/analytics.types";

import {
  formatPeso,
} from "@/utils/formatters";


type Props = {
  analytics: AnalyticsOverview;
};

type Metric = {
  label: string;
  current: number;
  previous: number;
  format: (value: number) => string;
};


const getBarWidth = (
  value: number,
  max: number
) =>
  max > 0
    ? Math.min((value / max) * 100, 100)
    : 0;


function PeriodComparisonChart({
  analytics,
}: Props) {
  if (analytics.period === "today") {
    return null;
  }

  const { comparison } = analytics;

  const metrics: Metric[] = [
    {
      label: "Revenue",
      current: analytics.total_revenue,
      previous:
        comparison.previous_total_revenue,
      format: formatPeso,
    },
    {
      label: "Orders",
      current: analytics.total_orders,
      previous:
        comparison.previous_total_orders,
      format: String,
    },
    {
      label: "Average Order Value",
      current:
        analytics.average_order_value,
      previous:
        comparison
          .previous_average_order_value,
      format: formatPeso,
    },
    {
      label: "Units Sold",
      current: analytics.units_sold,
      previous:
        comparison.previous_units_sold,
      format: String,
    },
  ];


  return (
    <section className="period-comparison-section">
      <div className="analytics-section-heading">
        <div>
          <p className="page-eyebrow">
            Period Comparison
          </p>

          <h2>
            Current vs Previous
          </h2>

          <p>
            Compare key business metrics against the
            immediately preceding equivalent period.
          </p>
        </div>
      </div>


      <div className="period-comparison-periods">
        <div>
          <span>
            Current Period
          </span>

          <strong>
            {analytics.start_date}
            {" — "}
            {analytics.end_date}
          </strong>
        </div>

        <div>
          <span>
            Previous Period
          </span>

          <strong>
            {comparison.previous_start_date}
            {" — "}
            {comparison.previous_end_date}
          </strong>
        </div>
      </div>


      <div className="period-comparison-grid">
        {metrics.map((metric) => {
          const max =
            Math.max(
              metric.current,
              metric.previous
            );

          const periods = [
            {
              label: "Current",
              value: metric.current,
              className:
                "period-comparison-bar-current",
            },
            {
              label: "Previous",
              value: metric.previous,
              className:
                "period-comparison-bar-previous",
            },
          ];


          return (
            <article
              key={metric.label}
              className="period-comparison-card"
            >
              <div className="period-comparison-card-header">
                <span>
                  {metric.label}
                </span>
              </div>


              {periods.map((period) => (
                <div
                  key={period.label}
                  className="period-comparison-row"
                >
                  <div className="period-comparison-row-label">
                    <span>
                      {period.label}
                    </span>

                    <strong>
                      {metric.format(
                        period.value
                      )}
                    </strong>
                  </div>


                  <div className="period-comparison-track">
                    <div
                      className={`period-comparison-bar ${period.className}`}
                      style={{
                        width: `${getBarWidth(
                          period.value,
                          max
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}


export default PeriodComparisonChart;