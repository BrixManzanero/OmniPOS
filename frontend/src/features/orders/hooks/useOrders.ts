import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getOrders,
  type Order,
} from "@/services/api";


export function useOrders() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getOrders();

        setOrders(data);

      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }

      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);


  const totalRevenue =
    useMemo(() => {
      return orders.reduce(
        (total, order) =>
          total + order.total_amount,
        0
      );
    }, [orders]);


  const completedOrders =
    useMemo(() => {
      return orders.filter(
        (order) =>
          order.status === "completed"
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