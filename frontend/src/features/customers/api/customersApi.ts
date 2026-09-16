import {
  apiRequest,
} from "@/shared/lib/apiClient";

import type {
  Customer,
  CustomerCreate,
  CustomerHistory,
} from "../types/customer.types";


export function getCustomers() {
  return apiRequest<Customer[]>(
    "/customers/",
    {
      errorMessage:
        "Failed to load customers.",
    }
  );
}


export function createCustomer(
  customer: CustomerCreate
) {
  return apiRequest<Customer>(
    "/customers/",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(customer),

      errorMessage:
        "Failed to create customer.",
    }
  );
}


export function getCustomerHistory(
  customerId: number
) {
  return apiRequest<CustomerHistory>(
    `/customers/${customerId}/history`,
    {
      errorMessage:
        "Failed to load customer history.",
    }
  );
}