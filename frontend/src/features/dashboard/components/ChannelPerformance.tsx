import type {
  DashboardSummary,
} from "../types/dashboard.types";

import {
  formatPeso,
} from "@/utils/formatters";


type Props = {
  summary: DashboardSummary | null;
};


function ChannelPerformance({
  summary,
}: Props) {

  const posRevenue =
    summary?.pos_revenue ?? 0;

  const onlineRevenue =
    summary?.online_revenue ?? 0;

  const totalRevenue =
    posRevenue + onlineRevenue;


  const posRevenuePercent =
    totalRevenue > 0
      ? (posRevenue / totalRevenue) * 100
      : 0;


  const onlineRevenuePercent =
    totalRevenue > 0
      ? (onlineRevenue / totalRevenue) * 100
      : 0;


  const posOrders =
    summary?.pos_orders ?? 0;

  const onlineOrders =
    summary?.online_orders ?? 0;

  const totalOrders =
    posOrders + onlineOrders;


  const posOrderPercent =
    totalOrders > 0
      ? (posOrders / totalOrders) * 100
      : 0;


  const onlineOrderPercent =
    totalOrders > 0
      ? (onlineOrders / totalOrders) * 100
      : 0;


  return (
    <section className="section-card">

      <div className="section-card-header">

        <div>

          <p className="page-eyebrow">
            Omnichannel
          </p>

          <h2>
            POS vs Online
          </h2>

          <p>
            Compare today's sales performance
            across physical and online channels.
          </p>

        </div>

      </div>


      <div className="channel-performance-grid">

        {/* =========================
            POS
        ========================= */}

        <article className="channel-performance-card">

          <div className="channel-performance-title">

            <div>

              <span className="page-eyebrow">
                Physical Store
              </span>

              <h3>
                POS
              </h3>

            </div>


            <strong>
              {posRevenuePercent.toFixed(1)}%
            </strong>

          </div>


          <div className="channel-performance-value">

            {formatPeso(
              posRevenue
            )}

          </div>


          <div
            className="channel-progress-track"
            aria-label={`POS revenue share ${posRevenuePercent.toFixed(1)}%`}
          >

            <div
              className="channel-progress-value"
              style={{
                width:
                  `${posRevenuePercent}%`,
                background:
                  "var(--chart-current)",
              }}
            />

          </div>


          <div className="channel-performance-meta">

            <div>

              <span>
                Orders
              </span>

              <strong>
                {posOrders}
              </strong>

            </div>


            <div>

              <span>
                Order Share
              </span>

              <strong>
                {posOrderPercent.toFixed(1)}%
              </strong>

            </div>


            <div>

              <span>
                AOV
              </span>

              <strong>
                {formatPeso(
                  summary?.pos_aov ?? 0
                )}
              </strong>

            </div>

          </div>

        </article>


        {/* =========================
            ONLINE
        ========================= */}

        <article className="channel-performance-card">

          <div className="channel-performance-title">

            <div>

              <span className="page-eyebrow">
                Digital Store
              </span>

              <h3>
                Online
              </h3>

            </div>


            <strong>
              {onlineRevenuePercent.toFixed(1)}%
            </strong>

          </div>


          <div className="channel-performance-value">

            {formatPeso(
              onlineRevenue
            )}

          </div>


          <div
            className="channel-progress-track"
            aria-label={`Online revenue share ${onlineRevenuePercent.toFixed(1)}%`}
          >

            <div
              className="channel-progress-value"
              style={{
                width:
                  `${onlineRevenuePercent}%`,
                background:
                  "var(--chart-current)",
              }}
            />

          </div>


          <div className="channel-performance-meta">

            <div>

              <span>
                Orders
              </span>

              <strong>
                {onlineOrders}
              </strong>

            </div>


            <div>

              <span>
                Order Share
              </span>

              <strong>
                {onlineOrderPercent.toFixed(1)}%
              </strong>

            </div>


            <div>

              <span>
                AOV
              </span>

              <strong>
                {formatPeso(
                  summary?.online_aov ?? 0
                )}
              </strong>

            </div>

          </div>

        </article>

      </div>

    </section>
  );
}


export default ChannelPerformance;