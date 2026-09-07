import {
  useState,
} from "react";

import type {
  AnalyticsPeriod,
} from "@/services/api";

import AnalyticsFilters
  from "./components/AnalyticsFilters";

import AnalyticsOverviewCards
  from "./components/AnalyticsOverviewCards";

import SalesTrendChart
  from "./components/SalesTrendChart";

import ChannelPerformance
  from "./components/ChannelPerformance";

import CustomerSegmentsChart
  from "./components/CustomerSegmentsChart";

import TopProductsChart
  from "./components/TopProductsChart";

import PeriodComparisonChart
  from "./components/PeriodComparisonChart";

import {
  useAnalyticsOverview,
} from "./hooks/useAnalyticsOverview";


function AnalyticsPage() {

  const [
    period,
    setPeriod,
  ] = useState<AnalyticsPeriod>(
    "7d"
  );


  const [
    customStartDate,
    setCustomStartDate,
  ] = useState("");


  const [
    customEndDate,
    setCustomEndDate,
  ] = useState("");


  const [
    appliedStartDate,
    setAppliedStartDate,
  ] = useState<string | undefined>(
    undefined
  );


  const [
    appliedEndDate,
    setAppliedEndDate,
  ] = useState<string | undefined>(
    undefined
  );


  const {
    analytics,
    loading,
    error,
  } = useAnalyticsOverview({
    period,

    startDate:
      period === "custom"
        ? appliedStartDate
        : undefined,

    endDate:
      period === "custom"
        ? appliedEndDate
        : undefined,
  });


  function handlePeriodChange(
    newPeriod: AnalyticsPeriod
  ) {
    setPeriod(newPeriod);
  }


  function handleApplyCustom() {

    if (
      !customStartDate ||
      !customEndDate
    ) {
      return;
    }


    setAppliedStartDate(
      customStartDate
    );

    setAppliedEndDate(
      customEndDate
    );
  }


  const customRangeReady =
    period !== "custom" ||
    Boolean(
      appliedStartDate &&
      appliedEndDate
    );


  return (
    <div className="analytics-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Business Intelligence
          </p>

          <h1>
            Analytics
          </h1>

          <p>
            Analyze sales, channels,
            customers, products, and
            business performance.
          </p>

        </div>

      </div>


      {/* =========================
          FILTERS
      ========================= */}

      <AnalyticsFilters
        period={period}

        customStartDate={
          customStartDate
        }

        customEndDate={
          customEndDate
        }

        onPeriodChange={
          handlePeriodChange
        }

        onStartDateChange={
          setCustomStartDate
        }

        onEndDateChange={
          setCustomEndDate
        }

        onApplyCustom={
          handleApplyCustom
        }
      />


      {/* =========================
          ERROR
      ========================= */}

      {
        error && (
          <p className="error-message">
            {error}
          </p>
        )
      }


      {/* =========================
          CUSTOM RANGE MESSAGE
      ========================= */}

      {
        period === "custom" &&
        !customRangeReady && (

          <div className="analytics-empty-range">

            Select a start and end date,
            then click Apply.

          </div>

        )
      }


      {/* =========================
          LOADING
      ========================= */}

      {
        loading && (
          <p>
            Loading analytics...
          </p>
        )
      }


      {/* =========================
          ANALYTICS CONTENT
      ========================= */}

      {
        !loading &&
        analytics &&
        customRangeReady && (

          <>

            {/* =========================
                PERIOD INFO
            ========================= */}

            <div className="analytics-period-info">

              <span>
                Selected Period
              </span>

              <strong>
                {analytics.start_date}
                {" — "}
                {analytics.end_date}
              </strong>

              <small>
                {analytics.days}
                {
                  analytics.days === 1
                    ? " day"
                    : " days"
                }
              </small>

            </div>


            {/* =========================
                OVERVIEW KPIs
            ========================= */}

            <AnalyticsOverviewCards
              analytics={analytics}
            />


            {/* =========================
                SALES ACTIVITY
            ========================= */}

            <SalesTrendChart
              analytics={analytics}
            />


            {/* =========================
                CHANNEL PERFORMANCE
            ========================= */}

            <ChannelPerformance
              analytics={analytics}
            />


            {/* =========================
                CUSTOMER SEGMENTS
            ========================= */}

            <CustomerSegmentsChart
              analytics={analytics}
            />


            {/* =========================
                TOP PRODUCTS
            ========================= */}

            <TopProductsChart
              analytics={analytics}
            />


            {/* =========================
                PERIOD COMPARISON
                Hidden for Today
            ========================= */}

            {
              analytics.period !== "today" && (
                <PeriodComparisonChart
                  analytics={analytics}
                />
              )
            }

          </>

        )
      }

    </div>
  );
}


export default AnalyticsPage;