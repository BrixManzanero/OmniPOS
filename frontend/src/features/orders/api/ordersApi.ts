import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  CheckoutItem,
  Order,
  OrderChannel,
  PaymentMethod,
} from "../types/order.types";


export function checkoutOrder(
  paymentMethod: PaymentMethod,
  items: CheckoutItem[],
  customerId: number | null = null,
  orderChannel: OrderChannel = "POS"
) {
  return apiRequest<Order>(
    "/orders/checkout",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        customer_id: customerId,
        order_channel: orderChannel,
        payment_method: paymentMethod,
        items,
      }),

      errorMessage:
        "Checkout failed.",
    }
  );
}


export function getOrders() {
  return apiRequest<Order[]>(
    "/orders/",
    {
      errorMessage:
        "Failed to load orders.",
    }
  );
}