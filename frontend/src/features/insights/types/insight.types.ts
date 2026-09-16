import type {
  PromotionCreate,
} from "@/features/promotions/types/promotion.types";


export type InsightSeverity =
  | "opportunity"
  | "warning"
  | "info";


export type InsightMetric = {
  label: string;
  value: string;
};


export type Insight = {
  id: string;
  title: string;
  summary: string;
  severity: InsightSeverity;

  metrics: InsightMetric[];

  // NULL means the insight is informational only.
  suggested_promotion: PromotionCreate | null;
};


export type InsightsResult = {
  generated_at: string;
  period_days: number;
  orders_analyzed: number;

  insights: Insight[];
};
