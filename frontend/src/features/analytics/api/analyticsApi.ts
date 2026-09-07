import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
} from "../types/analytics.types";

import {
  apiRequest,
} from "@/shared/lib/apiClient";


export function getAnalyticsOverview({
  period,
  startDate,
  endDate,
}: AnalyticsOverviewParams) {
  const params =
    new URLSearchParams({
      period,
    });

  if (
    period === "custom" &&
    startDate &&
    endDate
  ) {
    params.set(
      "start_date",
      startDate
    );

    params.set(
      "end_date",
      endDate
    );
  }

  return apiRequest<AnalyticsOverview>(
    `/analytics/overview?${params}`,
    {
      errorMessage:
        "Failed to load analytics overview.",
    }
  );
}