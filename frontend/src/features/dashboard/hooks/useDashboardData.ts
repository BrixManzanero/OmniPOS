import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDashboardAnalytics,
  getDashboardSummary,
} from "../api/dashboardApi";

import type {
  DashboardAnalytics,
  DashboardSummary,
} from "../types/dashboard.types";


const REFRESH_INTERVAL_MS = 5000;


export function useDashboardData() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [refreshError, setRefreshError] =
    useState("");


  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;


    async function loadDashboard(
      initial = false
    ) {
      if (requestInProgress) {
        return;
      }

      requestInProgress = true;


      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
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


        setSummary(summaryData);
        setAnalytics(analyticsData);

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


        if (initial) {
          setError(message);
        } else {
          setRefreshError(message);
        }
      } finally {
        requestInProgress = false;


        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }


    void loadDashboard(true);


    const intervalId =
      window.setInterval(
        () => {
          void loadDashboard();
        },
        REFRESH_INTERVAL_MS
      );


    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );
    };
  }, []);


  const {
    sevenDaySales,
    sevenDayOrders,
  } = useMemo(() => {
    const sales =
      analytics?.sales_last_7_days ?? [];


    return sales.reduce(
      (totals, day) => ({
        sevenDaySales:
          totals.sevenDaySales +
          day.sales,

        sevenDayOrders:
          totals.sevenDayOrders +
          day.orders,
      }),
      {
        sevenDaySales: 0,
        sevenDayOrders: 0,
      }
    );
  }, [analytics]);


  const averageOrderValue =
    sevenDayOrders > 0
      ? sevenDaySales /
        sevenDayOrders
      : 0;


  const forecastChartData =
    useMemo(() => {
      if (!analytics) {
        return [];
      }


      const historical =
        analytics.sales_last_7_days.map(
          (day) => ({
            label: day.label,
            actual: day.sales,
            forecast:
              null as number | null,
          })
        );


      const last =
        analytics.sales_last_7_days.at(
          -1
        );


      const bridge = last
        ? [
            {
              label: last.label,
              actual: last.sales,
              forecast: last.sales,
            },
          ]
        : [];


      const future =
        analytics.forecast.map(
          (day) => ({
            label: day.label,
            actual:
              null as number | null,
            forecast:
              day.forecast_sales,
          })
        );


      return [
        ...historical.slice(0, -1),
        ...bridge,
        ...future,
      ];
    }, [analytics]);


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