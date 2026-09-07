export type PaymentMethod =
  | "cash"
  | "gcash"
  | "maya"
  | "card";


export type OrderChannel =
  | "POS"
  | "ONLINE";


export type CheckoutItem = {
  product_id: number;
  quantity: number;
};


export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};


export type OrderCustomer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
};


export type Order = {
  id: number;

  customer_id: number | null;
  customer: OrderCustomer | null;

  order_channel: OrderChannel;

  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;

  items: OrderItem[];
};