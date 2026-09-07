import type {
  AnalyticsOverview,
} from "../types/analytics.types";

import {
  formatPeso,
} from "@/utils/formatters";

import {
  ComparisonBadge,
} from "./ComparisonBadge";


type Props = {
  analytics: AnalyticsOverview;
};


function AnalyticsOverviewCards({
  analytics,
}: Props) {
  const compare =
    analytics.period !== "today";

  const cards = [
    {
      label:
        compare
          ? "Total Revenue"
          : "Today's Revenue",

      value:
        formatPeso(
          analytics.total_revenue
        ),

      change:
        analytics.comparison
          .revenue_change_percent,
    },
    {
      label:
        compare
          ? "Total Orders"
          : "Orders Today",

      value:
        analytics.total_orders
          .toLocaleString(),

      change:
        analytics.comparison
          .orders_change_percent,
    },
    {
      label:
        "Average Order Value",

      value:
        formatPeso(
          analytics.average_order_value
        ),

      change:
        analytics.comparison
          .aov_change_percent,
    },
    {
      label:
        compare
          ? "Units Sold"
          : "Units Sold Today",

      value:
        analytics.units_sold
          .toLocaleString(),

      change:
        analytics.comparison
          .units_change_percent,
    },
  ];


  return (
    <div className="analytics-overview-grid">
      {cards.map((card) => (
        <article
          key={card.label}
          className="metric-card"
        >
          <span>
            {card.label}
          </span>

          <strong>
            {card.value}
          </strong>

          {compare && (
            <ComparisonBadge
              value={card.change}
            />
          )}
        </article>
      ))}
    </div>
  );
}


export default AnalyticsOverviewCards;