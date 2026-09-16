import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  Promotion,
  PromotionCreate,
  PromotionStatus,
} from "../types/promotion.types";


export function getPromotions(
  status?: PromotionStatus
) {
  const query = status
    ? `?status=${status}`
    : "";

  return apiRequest<Promotion[]>(
    `/promotions/${query}`,
    {
      errorMessage:
        "Failed to load promotions.",
    }
  );
}


export function createPromotion(
  promotion: PromotionCreate
) {
  return apiRequest<Promotion>(
    "/promotions/",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(promotion),

      errorMessage:
        "Failed to create promotion.",
    }
  );
}


export function updatePromotionStatus(
  promotionId: number,
  status: PromotionStatus
) {
  return apiRequest<Promotion>(
    `/promotions/${promotionId}/status`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({ status }),

      errorMessage:
        "Failed to update promotion status.",
    }
  );
}


export function deletePromotion(
  promotionId: number
) {
  return apiRequest<void>(
    `/promotions/${promotionId}`,
    {
      method: "DELETE",

      errorMessage:
        "Failed to delete promotion.",
    }
  );
}
