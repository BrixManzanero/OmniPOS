import type {
  AnalyticsOverview,
} from "../types/analytics.types";


type DailySale =
  AnalyticsOverview[
    "daily_sales"
  ][number];


export type SalesComparisonRow = {
  label: string;

  currentDate: string;
  currentSales: number;
  currentOrders: number;

  previousDate: string | null;
  previousSales: number;
  previousOrders: number;
};


export function buildSalesComparisonData(
  current: DailySale[],
  previous: DailySale[]
): SalesComparisonRow[] {
  return current.map(
    (day, index) => ({
      label: day.label,

      currentDate: day.date,
      currentSales: day.sales,
      currentOrders: day.orders,

      previousDate:
        previous[index]?.date ??
        null,

      previousSales:
        previous[index]?.sales ??
        0,

      previousOrders:
        previous[index]?.orders ??
        0,
    })
  );
}


export function getPeakSalesDay(
  sales: DailySale[]
): DailySale | null {
  return sales.reduce<
    DailySale | null
  >(
    (peak, day) =>
      !peak ||
      day.sales > peak.sales
        ? day
        : peak,
    null
  );
}