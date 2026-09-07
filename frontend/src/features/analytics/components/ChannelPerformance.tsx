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

type ChannelKey =
  keyof AnalyticsOverview["previous_channels"];

type ChannelMetrics =
  AnalyticsOverview["previous_channels"]["pos"];


const CHANNELS = [
  {
    key: "pos",
    name: "POS",
    label: "Physical Store",
  },
  {
    key: "online",
    name: "Online",
    label: "Digital Store",
  },
] as const;


const percent = (
  value: number,
  total: number
) =>
  total > 0
    ? (value / total) * 100
    : 0;


function ChannelPerformance({
  analytics,
}: Props) {
  const compare =
    analytics.period !== "today";


  const current: Record<
    ChannelKey,
    ChannelMetrics
  > = {
    pos: {
      revenue: analytics.pos_revenue,
      orders: analytics.pos_orders,
      aov: analytics.pos_aov,
    },

    online: {
      revenue: analytics.online_revenue,
      orders: analytics.online_orders,
      aov: analytics.online_aov,
    },
  };


  const currentTotals = {
    revenue:
      analytics.total_revenue,

    orders:
      analytics.total_orders,
  };


  const previousTotals = {
    revenue:
      analytics.previous_channels.pos.revenue +
      analytics.previous_channels.online.revenue,

    orders:
      analytics.previous_channels.pos.orders +
      analytics.previous_channels.online.orders,
  };


  const channels =
    CHANNELS.map(
      ({ key, name, label }) => {
        const now =
          current[key];

        const previous =
          analytics.previous_channels[key];

        return {
          key,
          name,
          label,
          now,
          previous,

          revenueShare:
            percent(
              now.revenue,
              currentTotals.revenue
            ),

          orderShare:
            percent(
              now.orders,
              currentTotals.orders
            ),

          previousRevenueShare:
            percent(
              previous.revenue,
              previousTotals.revenue
            ),

          previousOrderShare:
            percent(
              previous.orders,
              previousTotals.orders
            ),
        };
      }
    );


  return (
    <section className="analytics-channel-section">
      <div className="analytics-section-heading">
        <div>
          <p className="page-eyebrow">
            Channel Performance
          </p>

          <h2>
            POS vs Online
          </h2>

          <p>
            {compare
              ? "Compare physical and digital sales with the previous equivalent period."
              : "Today's physical and digital sales performance."}
          </p>
        </div>
      </div>


      <div className="analytics-channel-grid">
        {channels.map((channel) => (
          <article
            key={channel.key}
            className="analytics-channel-card"
          >
            <div className="analytics-channel-card-header">
              <div>
                <span className="analytics-channel-label">
                  {channel.label}
                </span>

                <h3>
                  {channel.name}
                </h3>
              </div>

              <strong>
                {channel.revenueShare.toFixed(1)}%
              </strong>
            </div>


            <div className="analytics-channel-revenue">
              <strong>
                {formatPeso(
                  channel.now.revenue
                )}
              </strong>

              <span>
                {compare
                  ? "Current Revenue"
                  : "Revenue Today"}
              </span>
            </div>


            <div className="analytics-channel-progress">
              <div
                className="analytics-channel-progress-bar"
                style={{
                  width: `${Math.min(
                    channel.revenueShare,
                    100
                  )}%`,
                }}
              />
            </div>


            <div className="analytics-channel-metrics">
              <div>
                <span>
                  Orders
                </span>

                <strong>
                  {channel.now.orders}
                </strong>
              </div>

              <div>
                <span>
                  Order Share
                </span>

                <strong>
                  {channel.orderShare.toFixed(1)}%
                </strong>
              </div>

              <div>
                <span>
                  AOV
                </span>

                <strong>
                  {formatPeso(
                    channel.now.aov
                  )}
                </strong>
              </div>
            </div>


            {compare && (
              <div className="analytics-channel-comparison">
                <div className="analytics-channel-comparison-heading">
                  <strong>
                    Current vs Previous
                  </strong>
                </div>


                <div className="analytics-channel-comparison-values">
                  <div>
                    <span>
                      Current
                    </span>

                    <strong>
                      {formatPeso(
                        channel.now.revenue
                      )}
                    </strong>

                    <small>
                      {channel.now.orders} orders
                    </small>
                  </div>

                  <div>
                    <span>
                      Previous
                    </span>

                    <strong>
                      {formatPeso(
                        channel.previous.revenue
                      )}
                    </strong>

                    <small>
                      {channel.previous.orders} orders
                    </small>
                  </div>
                </div>


                <div className="analytics-channel-change-grid">
                  <div>
                    <span>
                      Revenue
                    </span>

                    <ComparisonBadge
                      value={getPercentChange(
                        channel.now.revenue,
                        channel.previous.revenue
                      )}
                    />
                  </div>

                  <div>
                    <span>
                      Orders
                    </span>

                    <ComparisonBadge
                      value={getPercentChange(
                        channel.now.orders,
                        channel.previous.orders
                      )}
                    />
                  </div>

                  <div>
                    <span>
                      AOV
                    </span>

                    <ComparisonBadge
                      value={getPercentChange(
                        channel.now.aov,
                        channel.previous.aov
                      )}
                    />
                  </div>
                </div>


                <div className="analytics-channel-previous-share">
                  <span>
                    Previous Revenue Share
                  </span>

                  <strong>
                    {channel.previousRevenueShare.toFixed(
                      1
                    )}
                    %
                  </strong>
                </div>

                <div className="analytics-channel-previous-share">
                  <span>
                    Previous Order Share
                  </span>

                  <strong>
                    {channel.previousOrderShare.toFixed(
                      1
                    )}
                    %
                  </strong>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}


export default ChannelPerformance;