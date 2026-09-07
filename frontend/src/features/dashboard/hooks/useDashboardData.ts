import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getDashboardAnalytics,
  getDashboardSummary,
  type DashboardAnalytics,
  type DashboardSummary,
} from "@/services/api";


const REFRESH_INTERVAL_MS = 5000;


export function useDashboardData() {

  const [
    summary,
    setSummary,
  ] = useState<DashboardSummary | null>(
    null
  );


  const [
    analytics,
    setAnalytics,
  ] = useState<DashboardAnalytics | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    refreshError,
    setRefreshError,
  ] = useState("");


  /*
   * Prevent multiple dashboard requests
   * from running at the same time.
   */
  const requestInProgress =
    useRef(false);


  useEffect(() => {

    let cancelled =
      false;


    async function loadDashboard(
      initialLoad = false
    ) {

      if (
        requestInProgress.current
      ) {
        return;
      }


      requestInProgress.current =
        true;


      try {

        if (initialLoad) {

          setLoading(true);
          setError("");

        } else {

          setRefreshing(true);
          setRefreshError("");

        }


        const [
          summaryData,
          analyticsData,
        ] = await Promise.all([
          getDashboardSummary(),
          getDashboardAnalytics(),
        ]);


        if (cancelled) {
          return;
        }


        setSummary(
          summaryData
        );

        setAnalytics(
          analyticsData
        );


        /*
         * Clear errors after
         * a successful request.
         */
        setError("");
        setRefreshError("");

      } catch (err) {

        if (cancelled) {
          return;
        }


        const message =
          err instanceof Error
            ? err.message
            : "Failed to load dashboard.";


        /*
         * Initial failure:
         * show normal dashboard error.
         *
         * Background refresh failure:
         * keep existing dashboard visible.
         */
        if (initialLoad) {

          setError(
            message
          );

        } else {

          setRefreshError(
            message
          );

        }

      } finally {

        requestInProgress.current =
          false;


        if (!cancelled) {

          setLoading(false);
          setRefreshing(false);

        }

      }

    }


    /*
     * Load immediately when
     * Dashboard opens.
     */
    loadDashboard(true);


    /*
     * Auto-refresh real backend
     * data every 5 seconds.
     */
    const interval =
      window.setInterval(
        () => {

          loadDashboard(false);

        },
        REFRESH_INTERVAL_MS
      );


    return () => {

      cancelled = true;

      window.clearInterval(
        interval
      );

    };

  }, []);


  /* =========================
     7-DAY SALES
  ========================= */

  const sevenDaySales =
    useMemo(() => {

      return (
        analytics
          ?.sales_last_7_days
          .reduce(
            (
              total,
              day
            ) =>
              total +
              day.sales,
            0
          ) ?? 0
      );

    }, [
      analytics,
    ]);


  /* =========================
     7-DAY ORDERS
  ========================= */

  const sevenDayOrders =
    useMemo(() => {

      return (
        analytics
          ?.sales_last_7_days
          .reduce(
            (
              total,
              day
            ) =>
              total +
              day.orders,
            0
          ) ?? 0
      );

    }, [
      analytics,
    ]);


  /* =========================
     AVERAGE ORDER VALUE
  ========================= */

  const averageOrderValue =
    sevenDayOrders > 0
      ? (
          sevenDaySales /
          sevenDayOrders
        )
      : 0;


  /* =========================
     FORECAST CHART DATA
  ========================= */

  const forecastChartData =
    useMemo(() => {

      if (!analytics) {
        return [];
      }


      const historical =
        analytics
          .sales_last_7_days
          .map(
            (day) => ({
              label:
                day.label,

              actual:
                day.sales,

              forecast:
                null as number | null,
            })
          );


      const lastHistorical =
        analytics
          .sales_last_7_days[
            analytics
              .sales_last_7_days
              .length - 1
          ];


      const bridgePoint =
        lastHistorical
          ? {
              label:
                lastHistorical.label,

              actual:
                lastHistorical.sales,

              forecast:
                lastHistorical.sales,
            }
          : null;


      const future =
        analytics.forecast.map(
          (day) => ({
            label:
              day.label,

            actual:
              null as number | null,

            forecast:
              day.forecast_sales,
          })
        );


      return [
        ...historical.slice(
          0,
          -1
        ),

        ...(
          bridgePoint
            ? [bridgePoint]
            : []
        ),

        ...future,
      ];

    }, [
      analytics,
    ]);


  return {
    summary,
    analytics,

    loading,
    refreshing,

    error,
    refreshError,

    sevenDaySales,
    sevenDayOrders,
    averageOrderValue,

    forecastChartData,
  };
}