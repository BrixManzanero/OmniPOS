import type {
  Product,
} from "@/types/product";


/* =========================
   CART ITEM
========================= */

export type CartItem = {
  product: Product;
  quantity: number;
  lineTotal: number;
};


/* =========================
   STOCK CONFLICT

   Raised when live stock moves
   underneath a cart that is
   already open - the other
   channel sold the same units.
========================= */

export type CartConflictReason =
  | "unavailable"
  | "insufficient";


export type CartConflict = {
  productId: number;
  productName: string;
  reason: CartConflictReason;

  /** What the cart is asking for. */
  requested: number;

  /** What the server currently has. */
  available: number;
};