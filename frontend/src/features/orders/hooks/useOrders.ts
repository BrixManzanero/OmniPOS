import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getOrders,
} from "../api/ordersApi";

import type {
  Order,
} from "../types/order.types";


export function useOrders() {
  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================
     LOAD ORDERS
  ========================= */

  useEffect(() => {
    let cancelled = false;


    getOrders()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setOrders(data);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load orders."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================
     TOTAL REVENUE
  ========================= */

  const totalRevenue =
    useMemo(() => {
      return orders.reduce(
        (total, order) =>
          total +
          order.total_amount,
        0
      );
    }, [orders]);


  /* =========================
     COMPLETED ORDERS
  ========================= */

  const completedOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          order.status ===
          "completed"
      ).length;
    }, [orders]);


  return {
    orders,
    loading,
    error,
    totalRevenue,
    completedOrders,
  };
}