import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  Product,
  ProductCreate,
} from "@/types/product";


export function getProducts() {
  return apiRequest<Product[]>(
    "/products/",
    {
      errorMessage:
        "Failed to load products.",
    }
  );
}


export function createProduct(
  product: ProductCreate
) {
  return apiRequest<Product>(
    "/products/",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(product),

      errorMessage:
        "Failed to create product.",
    }
  );
}