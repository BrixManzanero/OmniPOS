import {
  useEffect,
  useState,
} from "react";

import {
  getInsights,
} from "../api/insightsApi";

import type {
  InsightsResult,
} from "../types/insight.types";


export function useInsights() {
  const [
    result,
    setResult,
  ] = useState<InsightsResult | null>(
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


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;


    getInsights()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setResult(data);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load insights."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================
     RE-RUN ANALYSIS
  ========================= */

  async function refreshInsights() {
    try {
      setRefreshing(true);
      setError("");

      const data =
        await getInsights();

      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message
        );
      }
    } finally {
      setRefreshing(false);
    }
  }


  return {
    result,
    loading,
    refreshing,
    error,

    refreshInsights,
  };
}
