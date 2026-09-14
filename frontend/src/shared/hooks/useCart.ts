import { useCallback, useMemo, useState } from "react";

import type { Product } from "@/types/product";
import type { CartConflict, CartItem } from "@/shared/types/cart.types";

/**
 * A cart that tracks live stock.
 *
 * Only product IDs and quantities are stored. Names, prices and stock
 * are re-read from `products` on every render, so when the other
 * channel sells the same units, this cart sees it on the next refresh
 * instead of holding a stale copy from when the item was added.
 */

/** productId -> quantity */
type CartState = Record<number, number>;

function indexById(products: Product[]): Map<number, Product> {
  return new Map(products.map((product) => [product.id, product]));
}

function toEntries(cart: CartState): Array<[number, number]> {
  return Object.entries(cart)
    .map(([id, quantity]) => [Number(id), quantity] as [number, number])
    .filter(([, quantity]) => quantity > 0);
}

function buildItems(
  cart: CartState,
  byId: Map<number, Product>
): CartItem[] {
  const items: CartItem[] = [];

  for (const [productId, quantity] of toEntries(cart)) {
    const product = byId.get(productId);

    if (product) {
      items.push({
        product,
        quantity,
        lineTotal: product.price * quantity,
      });
    }
  }

  return items;
}

function findConflicts(
  cart: CartState,
  byId: Map<number, Product>
): CartConflict[] {
  const conflicts: CartConflict[] = [];

  for (const [productId, quantity] of toEntries(cart)) {
    const product = byId.get(productId);
    const gone = !product || !product.is_active || product.stock <= 0;

    if (gone) {
      conflicts.push({
        productId,
        productName: product?.name ?? `Product #${productId}`,
        reason: "unavailable",
        requested: quantity,
        available: product?.stock ?? 0,
      });
    } else if (product.stock < quantity) {
      conflicts.push({
        productId,
        productName: product.name,
        reason: "insufficient",
        requested: quantity,
        available: product.stock,
      });
    }
  }

  return conflicts;
}

function setOrDelete(
  cart: CartState,
  productId: number,
  quantity: number
): CartState {
  const next = { ...cart };

  if (quantity <= 0) {
    delete next[productId];
  } else {
    next[productId] = quantity;
  }

  return next;
}

export function useCart(products: Product[]) {
  const [cart, setCart] = useState<CartState>({});

  const byId = useMemo(() => indexById(products), [products]);
  const items = useMemo(() => buildItems(cart, byId), [cart, byId]);
  const conflicts = useMemo(() => findConflicts(cart, byId), [cart, byId]);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.lineTotal, 0),
    [items]
  );

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    [items]
  );

  /** Sets an exact quantity. Zero or less removes the line. */
  const setQuantity = useCallback((productId: number, quantity: number) => {
    setCart((current) => setOrDelete(current, productId, quantity));
  }, []);

  /** Adds one, but never more than the server says exists. */
  const addOne = useCallback((productId: number, stock: number) => {
    setCart((current) => {
      const quantity = current[productId] ?? 0;

      if (quantity >= stock) {
        return current;
      }

      return { ...current, [productId]: quantity + 1 };
    });
  }, []);

  const add = useCallback(
    (product: Product) => addOne(product.id, product.stock),
    [addOne]
  );

  const increase = useCallback(
    (productId: number) => {
      const product = byId.get(productId);

      if (product) {
        addOne(productId, product.stock);
      }
    },
    [addOne, byId]
  );

  const decrease = useCallback(
    (productId: number) =>
      setCart((current) =>
        setOrDelete(current, productId, (current[productId] ?? 0) - 1)
      ),
    []
  );

  const remove = useCallback(
    (productId: number) =>
      setCart((current) => setOrDelete(current, productId, 0)),
    []
  );

  const clear = useCallback(() => setCart({}), []);

  /**
   * Trims the cart to what is actually available, so the cashier can
   * carry on with a smaller order instead of starting over.
   */
  const reconcile = useCallback(() => {
    setCart((current) => {
      const next: CartState = {};

      for (const [productId, quantity] of toEntries(current)) {
        const product = byId.get(productId);

        if (product?.is_active && product.stock > 0) {
          next[productId] = Math.min(quantity, product.stock);
        }
      }

      return next;
    });
  }, [byId]);

  const quantityOf = useCallback(
    (productId: number) => cart[productId] ?? 0,
    [cart]
  );

  return {
    items,
    count,
    subtotal,
    isEmpty: items.length === 0,

    conflicts,
    hasConflicts: conflicts.length > 0,

    add,
    increase,
    decrease,
    remove,
    setQuantity,
    clear,
    reconcile,

    quantityOf,
    checkoutItems,
  };
}