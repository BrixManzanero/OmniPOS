import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  DashboardAnalytics,
  DashboardSummary,
} from "../types/dashboard.types";


export function getDashboardSummary() {
  return apiRequest<DashboardSummary>(
    "/dashboard/summary",
    {
      errorMessage:
        "Failed to load dashboard.",
    }
  );
}


export function getDashboardAnalytics() {
  return apiRequest<DashboardAnalytics>(
    "/analytics/dashboard",
    {
      errorMessage:
        "Failed to load dashboard analytics.",
    }
  );
}