import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  InsightsResult,
} from "../types/insight.types";


export function getInsights() {
  return apiRequest<InsightsResult>(
    "/insights/",
    {
      errorMessage:
        "Failed to load insights.",
    }
  );
}
