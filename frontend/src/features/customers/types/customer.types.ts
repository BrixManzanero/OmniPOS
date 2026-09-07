import type {
  Order,
} from "@/features/orders/types/order.types";


export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  is_active: boolean;
};


export type CustomerCreate = {
  name: string;
  phone?: string | null;
  email?: string | null;
};


export type CustomerHistorySummary = {
  total_orders: number;
  total_spent: number;
  average_order_value: number;

  first_purchase: string | null;
  last_purchase: string | null;

  pos_orders: number;
  online_orders: number;

  returning_customer: boolean;
};


export type CustomerHistory = {
  customer: Customer;

  summary: CustomerHistorySummary;

  orders: Order[];
};