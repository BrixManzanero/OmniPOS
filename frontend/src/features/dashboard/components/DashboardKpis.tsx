import type {
  DashboardSummary,
} from "../types/dashboard.types";

import {
  formatPeso,
} from "@/utils/formatters";


type Props = {
  summary: DashboardSummary | null;
};


function DashboardKpis({
  summary,
}: Props) {
  return (
    <div>

      {/* =========================
          GENERAL KPIs
      ========================= */}

      <div className="dashboard-grid">

        <div className="metric-card">

          <span>
            Today's Sales
          </span>

          <strong>
            {formatPeso(
              summary?.todays_sales ?? 0
            )}
          </strong>

          <small>
            Revenue from completed orders
          </small>

        </div>


        <div className="metric-card">

          <span>
            Orders Today
          </span>

          <strong>
            {summary?.orders_today ?? 0}
          </strong>

          <small>
            Completed transactions
          </small>

        </div>


        <div className="metric-card">

          <span>
            Customers
          </span>

          <strong>
            {summary?.customers ?? 0}
          </strong>

          <small>
            Registered customers
          </small>

        </div>


        <div className="metric-card">

          <span>
            Low Stock
          </span>

          <strong>
            {summary?.low_stock ?? 0}
          </strong>

          <small>
            5 units or fewer
          </small>

        </div>

      </div>


      {/* =========================
          CUSTOMER ACTIVITY
      ========================= */}

      <div className="dashboard-kpi-section">

        <div className="dashboard-kpi-heading">

          <div>

            <p className="page-eyebrow">
              Customer Mix
            </p>

            <h2>
              Customer Activity
            </h2>

          </div>

        </div>


        <div className="customer-activity-grid">

          <div className="metric-card">

            <span>
              Walk-in / Guest Orders
            </span>

            <strong>
              {
                summary?.guest_walkin_orders ??
                0
              }
            </strong>

            <small>
              {formatPeso(
                summary?.guest_walkin_revenue ??
                0
              )}
              {" revenue"}
            </small>

          </div>


          <div className="metric-card">

            <span>
              Registered Customer Orders
            </span>

            <strong>
              {
                summary?.registered_orders ??
                0
              }
            </strong>

            <small>
              {formatPeso(
                summary?.registered_revenue ??
                0
              )}
              {" revenue"}
            </small>

          </div>

        </div>

      </div>

    </div>
  );
}


export default DashboardKpis;