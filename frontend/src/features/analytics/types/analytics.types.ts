export type AnalyticsPeriod =
  | "today"
  | "7d"
  | "30d"
  | "custom";


export type AnalyticsDailySales = {
  date: string;
  label: string;
  sales: number;
  orders: number;
};


export type AnalyticsTopProduct = {
  name: string;
  quantity: number;
  revenue: number;
};


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


export type AnalyticsComparison = {
  previous_start_date: string;
  previous_end_date: string;

  previous_total_revenue: number;
  previous_total_orders: number;
  previous_average_order_value: number;
  previous_units_sold: number;

  revenue_change_percent: number | null;
  orders_change_percent: number | null;
  aov_change_percent: number | null;
  units_change_percent: number | null;
};


export type AnalyticsOverview = {
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  days: number;

  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  units_sold: number;

  pos_revenue: number;
  pos_orders: number;
  pos_aov: number;

  online_revenue: number;
  online_orders: number;
  online_aov: number;

  guest_walkin_orders: number;
  guest_walkin_revenue: number;

  registered_orders: number;
  registered_revenue: number;

  unique_registered_customers: number;

  segments: AnalyticsSegments;

  daily_sales: AnalyticsDailySales[];
  top_products: AnalyticsTopProduct[];

  previous_daily_sales:
    AnalyticsDailySales[];

  previous_top_products:
    AnalyticsTopProduct[];

  previous_segments:
    AnalyticsSegments;

  previous_channels:
    AnalyticsChannels;

  comparison:
    AnalyticsComparison;
};


export type AnalyticsOverviewParams = {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
};