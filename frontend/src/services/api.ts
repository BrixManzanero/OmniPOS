import type {
  Product,
  ProductCreate,
} from "@/types/product";


const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");


/* =========================
   PRODUCTS
========================= */

export async function getProducts():
  Promise<Product[]> {

  const response = await fetch(
    `${API_URL}/products/`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load products."
    );
  }


  return response.json();
}


export async function createProduct(
  product: ProductCreate
): Promise<Product> {

  const response = await fetch(
    `${API_URL}/products/`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(product),
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Failed to create product."
    );
  }


  return response.json();
}


/* =========================
   ORDERS / CHECKOUT
========================= */

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


/* Customer information
   included in an order
*/

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


export async function checkoutOrder(
  paymentMethod: PaymentMethod,
  items: CheckoutItem[],
  customerId: number | null = null,
  orderChannel: OrderChannel = "POS"
): Promise<Order> {

  const response = await fetch(
    `${API_URL}/orders/checkout`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        customer_id: customerId,
        order_channel: orderChannel,

        payment_method:
          paymentMethod,

        items,
      }),
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Checkout failed."
    );
  }


  return response.json();
}


export async function getOrders():
  Promise<Order[]> {

  const response = await fetch(
    `${API_URL}/orders/`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load orders."
    );
  }


  return response.json();
}


/* =========================
   DASHBOARD
========================= */

export type DashboardSummary = {

  /* GENERAL */

  todays_sales: number;
  orders_today: number;
  customers: number;
  low_stock: number;
  total_products: number;


  /* CHANNEL PERFORMANCE */

  pos_revenue: number;
  online_revenue: number;

  pos_orders: number;
  online_orders: number;

  pos_aov: number;
  online_aov: number;


  /* CUSTOMER MIX */

  guest_walkin_orders: number;
  registered_orders: number;

  guest_walkin_revenue: number;
  registered_revenue: number;


  /* POS SEGMENTS */

  pos_walkin_orders: number;
  pos_walkin_revenue: number;

  pos_registered_orders: number;
  pos_registered_revenue: number;


  /* ONLINE SEGMENTS */

  online_guest_orders: number;
  online_guest_revenue: number;

  online_registered_orders: number;
  online_registered_revenue: number;
};


export async function getDashboardSummary():
  Promise<DashboardSummary> {

  const response = await fetch(
    `${API_URL}/dashboard/summary`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load dashboard."
    );
  }


  return response.json();
}


/* =========================
   DASHBOARD ANALYTICS
========================= */

export type DailySales = {
  date: string;
  label: string;
  sales: number;
  orders: number;
};


export type TopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};


export type ForecastPoint = {
  date: string;
  label: string;
  forecast_sales: number;
};


export type DashboardAnalytics = {
  sales_last_7_days:
    DailySales[];

  top_products:
    TopProduct[];

  forecast:
    ForecastPoint[];

  forecast_ready:
    boolean;

  forecast_note:
    string;
};


export async function getDashboardAnalytics():
  Promise<DashboardAnalytics> {

  const response = await fetch(
    `${API_URL}/analytics/dashboard`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load analytics."
    );
  }


  return response.json();
}


/* =========================
   INVENTORY
========================= */

export type RestockPayload = {
  product_id: number;
  quantity: number;
};


export async function getInventory():
  Promise<Product[]> {

  const response = await fetch(
    `${API_URL}/inventory/`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load inventory."
    );
  }


  return response.json();
}


export async function restockProduct(
  payload: RestockPayload
): Promise<Product> {

  const response = await fetch(
    `${API_URL}/inventory/restock`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(payload),
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Failed to restock product."
    );
  }


  return response.json();
}


/* =========================
   INVENTORY MOVEMENTS
========================= */

export type InventoryMovement = {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
};


export async function getInventoryMovements():
  Promise<InventoryMovement[]> {

  const response = await fetch(
    `${API_URL}/inventory/movements`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load inventory movements."
    );
  }


  return response.json();
}


/* =========================
   CUSTOMERS
========================= */

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


/* =========================
   CUSTOMER PURCHASE HISTORY
========================= */

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


export async function getCustomers():
  Promise<Customer[]> {

  const response = await fetch(
    `${API_URL}/customers/`
  );


  if (!response.ok) {
    throw new Error(
      "Failed to load customers."
    );
  }


  return response.json();
}


export async function createCustomer(
  customer: CustomerCreate
): Promise<Customer> {

  const response = await fetch(
    `${API_URL}/customers/`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(customer),
    }
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Failed to create customer."
    );
  }


  return response.json();
}


/* =========================
   GET CUSTOMER HISTORY
========================= */

export async function getCustomerHistory(
  customerId: number
): Promise<CustomerHistory> {

  const response = await fetch(
    `${API_URL}/customers/${customerId}/history`
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Failed to load customer history."
    );
  }


  return response.json();
}


/* =========================
   ANALYTICS V2
========================= */

export type AnalyticsPeriod =
  | "today"
  | "7d"
  | "30d"
  | "custom";


export type AnalyticsSegment = {
  orders: number;
  revenue: number;
};


export type AnalyticsSegments = {
  pos_walkin: AnalyticsSegment;
  pos_registered: AnalyticsSegment;
  online_guest: AnalyticsSegment;
  online_registered: AnalyticsSegment;
};


export type AnalyticsChannelMetrics = {
  orders: number;
  revenue: number;
  aov: number;
};


export type AnalyticsChannels = {
  pos: AnalyticsChannelMetrics;
  online: AnalyticsChannelMetrics;
};


/* =========================
   PREVIOUS PERIOD COMPARISON
========================= */

export type AnalyticsComparison = {
  previous_start_date: string;
  previous_end_date: string;

  previous_total_revenue: number;
  previous_total_orders: number;
  previous_average_order_value: number;
  previous_units_sold: number;

  revenue_change_percent:
    number | null;

  orders_change_percent:
    number | null;

  aov_change_percent:
    number | null;

  units_change_percent:
    number | null;
};


export type AnalyticsOverview = {

  /* PERIOD */

  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  days: number;


  /* OVERVIEW */

  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  units_sold: number;


  /* POS */

  pos_revenue: number;
  pos_orders: number;
  pos_aov: number;


  /* ONLINE */

  online_revenue: number;
  online_orders: number;
  online_aov: number;


  /* CUSTOMER MIX */

  guest_walkin_orders: number;
  guest_walkin_revenue: number;

  registered_orders: number;
  registered_revenue: number;

  unique_registered_customers: number;


  /* SEGMENTS */

  segments:
    AnalyticsSegments;


  /* CHART DATA */

  daily_sales:
    DailySales[];

  top_products:
    TopProduct[];


  /* PREVIOUS PERIOD BREAKDOWNS */

  previous_daily_sales:
    DailySales[];

  previous_top_products:
    TopProduct[];

  previous_segments:
    AnalyticsSegments;

  previous_channels:
    AnalyticsChannels;


  /* PREVIOUS PERIOD COMPARISON */

  comparison:
    AnalyticsComparison;
};


export type AnalyticsOverviewParams = {
  period: AnalyticsPeriod;

  startDate?: string;
  endDate?: string;
};


export async function getAnalyticsOverview({
  period,
  startDate,
  endDate,
}: AnalyticsOverviewParams):
  Promise<AnalyticsOverview> {

  const params =
    new URLSearchParams();


  params.set(
    "period",
    period
  );


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


  const response = await fetch(
    `${API_URL}/analytics/overview?${params.toString()}`
  );


  if (!response.ok) {

    const errorData =
      await response.json();


    throw new Error(
      errorData.detail ||
      "Failed to load analytics overview."
    );
  }


  return response.json();
}