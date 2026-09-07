import {
  useEffect,
  useState,
} from "react";

import {
  getAnalyticsOverview,
} from "@/services/api";

import type {
  AnalyticsOverview,
  AnalyticsPeriod,
} from "@/services/api";


type Params = {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
};


const REFRESH_INTERVAL_MS = 5000;


export function useAnalyticsOverview({
  period,
  startDate,
  endDate,
}: Params) {
  const [
    analytics,
    setAnalytics,
  ] = useState<AnalyticsOverview | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const customRangeIncomplete =
    period === "custom" &&
    (!startDate || !endDate);


  useEffect(() => {
    if (customRangeIncomplete) {
      return;
    }


    let cancelled = false;
    let requestInProgress = false;


    async function loadAnalytics(
      initialLoad = false
    ) {
      if (requestInProgress) {
        return;
      }


      requestInProgress = true;


      try {
        if (initialLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }


        setError(null);


        const data =
          await getAnalyticsOverview({
            period,
            startDate,
            endDate,
          });


        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load analytics."
          );
        }
      } finally {
        requestInProgress = false;


        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }


    void loadAnalytics(true);


    const intervalId =
      window.setInterval(
        () => {
          void loadAnalytics(false);
        },
        REFRESH_INTERVAL_MS
      );


    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );
    };
  }, [
    period,
    startDate,
    endDate,
    customRangeIncomplete,
  ]);


  return {
    analytics:
      customRangeIncomplete
        ? null
        : analytics,

    loading:
      customRangeIncomplete
        ? false
        : loading,

    refreshing:
      customRangeIncomplete
        ? false
        : refreshing,

    error:
      customRangeIncomplete
        ? null
        : error,
  };
}