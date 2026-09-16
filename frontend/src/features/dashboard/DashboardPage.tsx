import AnalyticsSummary
  from "./components/AnalyticsSummary";

import ChannelPerformance
  from "./components/ChannelPerformance";

import DashboardKpis
  from "./components/DashboardKpis";

import RevenueForecast
  from "./components/RevenueForecast";

import SalesChart
  from "./components/SalesChart";

import TopProductsChart
  from "./components/TopProductsChart";

import {
  useDashboardData,
} from "./hooks/useDashboardData";


function DashboardPage() {
  const {
    summary,
    analytics,

    loading,
    error,

    sevenDaySales,
    sevenDayOrders,
    averageOrderValue,

    forecastChartData,
  } = useDashboardData();


  if (loading) {
    return (
      <div className="dashboard-page">

        <h1>
          Dashboard
        </h1>

        <p>
          Loading dashboard...
        </p>

      </div>
    );
  }


  if (error) {
    return (
      <div className="dashboard-page">

        <h1>
          Dashboard
        </h1>

        <p className="error-message">
          {error}
        </p>

      </div>
    );
  }


  return (
    <div className="dashboard-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Overview
          </p>

          <h1>
            Dashboard
          </h1>

          <p>
            Sales performance,
            channel activity,
            trends, and business insights.
          </p>

        </div>

      </div>


      {/* =========================
          GENERAL KPIs
      ========================= */}

      <DashboardKpis
        summary={summary}
      />


      {/* =========================
          POS VS ONLINE
      ========================= */}

      <ChannelPerformance
        summary={summary}
      />


      {/* =========================
          7-DAY SUMMARY
      ========================= */}

      <AnalyticsSummary
        sevenDaySales={
          sevenDaySales
        }
        sevenDayOrders={
          sevenDayOrders
        }
        averageOrderValue={
          averageOrderValue
        }
      />


      {/* =========================
          SALES TREND
      ========================= */}

      <SalesChart
        analytics={analytics}
      />


      {/* =========================
          PRODUCTS + FORECAST
      ========================= */}

      <div className="analytics-grid">

        <TopProductsChart
          analytics={analytics}
        />


        <RevenueForecast
          analytics={analytics}
          chartData={
            forecastChartData
          }
        />

      </div>

    </div>
  );
}


export default DashboardPage;