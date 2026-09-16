export type DiscountType =
  | "PERCENT"
  | "FIXED";

export type TargetType =
  | "ALL"
  | "PRODUCT"
  | "CATEGORY";

export type PromotionChannel =
  | "ALL"
  | "POS"
  | "ONLINE";

export type PromotionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED";

export type PromotionSource =
  | "MANUAL"
  | "AI";


export type Promotion = {
  id: number;
  name: string;
  description: string | null;

  discount_type: DiscountType;
  discount_value: number;

  target_type: TargetType;
  target_product_id: number | null;
  target_product_name: string | null;
  target_category: string | null;

  channel: PromotionChannel;

  start_date: string | null;
  end_date: string | null;
  start_hour: number | null;
  end_hour: number | null;

  status: PromotionStatus;
  source: PromotionSource;
  created_at: string;

  is_live: boolean;
};


export type PromotionCreate = {
  name: string;
  description?: string | null;

  discount_type: DiscountType;
  discount_value: number;

  target_type: TargetType;
  target_product_id?: number | null;
  target_category?: string | null;

  channel: PromotionChannel;

  start_date?: string | null;
  end_date?: string | null;
  start_hour?: number | null;
  end_hour?: number | null;

  status?: PromotionStatus;
  source?: PromotionSource;
};
