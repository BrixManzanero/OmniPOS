import { useCallback, useEffect, useRef, useState } from "react";

import { getProducts } from "@/features/products/api/productsApi";
import { getCustomers } from "@/features/customers/api/customersApi";
import type { Customer } from "@/features/customers/types/customer.types";
import type { Product } from "@/types/product";

/**
 * One shared source of stock for the physical POS and the online store.
 *
 * Polls on an interval so a sale on one channel shows up on the other
 * without a reload. Polling rather than a websocket: it works against
 * SQLite and Supabase alike and needs no extra service. Swapping to SSE
 * later means changing this file only - both pages keep this interface.
 */

const DEFAULT_POLL_MS = 5000;

type Options = {
  /** Hide products with no stock left. POS does, the storefront doesn't. */
  inStockOnly?: boolean;

  /** Also load the customer list. */
  withCustomers?: boolean;

  /** Milliseconds between refreshes. Pass 0 to disable polling. */
  pollInterval?: number;
};

type LiveData = {
  products: Product[];
  customers: Customer[];
};

/** Kept free of React state so the effect below can set state in a callback. */
async function fetchLiveData(
  inStockOnly: boolean,
  withCustomers: boolean
): Promise<LiveData> {
  const [products, customers] = await Promise.all([
    getProducts(),
    withCustomers ? getCustomers() : Promise.resolve<Customer[]>([]),
  ]);

  return {
    products: products.filter(
      (product) =>
        product.is_active && (!inStockOnly || product.stock > 0)
    ),
    customers: customers.filter((customer) => customer.is_active),
  };
}

export function useLiveProducts(options: Options = {}) {
  const {
    inStockOnly = false,
    withCustomers = false,
    pollInterval = DEFAULT_POLL_MS,
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /** Guards against overlapping polls on a slow connection. */
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetchLiveData(inStockOnly, withCustomers)
      .then((data) => {
        if (cancelled) return;

        setProducts(data.products);
        if (withCustomers) setCustomers(data.customers);
        setLastUpdated(new Date());
      })
      .catch((caught) => {
        if (!cancelled && caught instanceof Error) setError(caught.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inStockOnly, withCustomers]);

  /**
   * Background refresh. A failed poll keeps the last good data on screen -
   * wiping the shelf because one request timed out is worse than showing
   * stock that is a few seconds old.
   */
  const refresh = useCallback(async () => {
    if (inFlight.current) return;

    inFlight.current = true;

    try {
      const data = await fetchLiveData(inStockOnly, withCustomers);

      setProducts(data.products);
      if (withCustomers) setCustomers(data.customers);
      setError("");
      setLastUpdated(new Date());
    } catch {
      // Silent by design - see above.
    } finally {
      inFlight.current = false;
    }
  }, [inStockOnly, withCustomers]);

  /**
   * Polling pauses while the tab is hidden, so an idle terminal isn't
   * hammering the API all day, then refreshes on return - the moment the
   * stock is most likely to be stale.
   */
  useEffect(() => {
    if (pollInterval <= 0) return;

    let timer: number | undefined;

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      stop();
      timer = window.setInterval(() => void refresh(), pollInterval);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }

      void refresh();
      start();
    };

    if (!document.hidden) start();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [refresh, pollInterval]);

  return {
    products,
    customers,
    loading,
    error,
    lastUpdated,
    refresh,
    setError,
  };
}