import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  Product,
} from "@/types/product";

import type {
  InventoryMovement,
  RestockPayload,
} from "../types/inventory.types";


export function getInventory() {
  return apiRequest<Product[]>(
    "/inventory/",
    {
      errorMessage:
        "Failed to load inventory.",
    }
  );
}


export function restockProduct(
  payload: RestockPayload
) {
  return apiRequest<Product>(
    "/inventory/restock",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(payload),

      errorMessage:
        "Failed to restock product.",
    }
  );
}


export function getInventoryMovements() {
  return apiRequest<InventoryMovement[]>(
    "/inventory/movements",
    {
      errorMessage:
        "Failed to load inventory movements.",
    }
  );
}