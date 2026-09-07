export type DashboardSummary = {
  todays_sales: number;
  orders_today: number;
  customers: number;
  low_stock: number;
  total_products: number;

  pos_revenue: number;
  online_revenue: number;

  pos_orders: number;
  online_orders: number;

  pos_aov: number;
  online_aov: number;

  guest_walkin_orders: number;
  registered_orders: number;

  guest_walkin_revenue: number;
  registered_revenue: number;

  pos_walkin_orders: number;
  pos_walkin_revenue: number;

  pos_registered_orders: number;
  pos_registered_revenue: number;

  online_guest_orders: number;
  online_guest_revenue: number;

  online_registered_orders: number;
  online_registered_revenue: number;
};


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
  sales_last_7_days: DailySales[];
  top_products: TopProduct[];
  forecast: ForecastPoint[];

  forecast_ready: boolean;
  forecast_note: string;
};