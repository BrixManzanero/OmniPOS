import {
  useEffect,
  useState,
} from "react";

import {
  createCustomer,
  getCustomers,
} from "../api/customersApi";

import type {
  Customer,
  CustomerCreate,
} from "../types/customer.types";


export function useCustomers() {
  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;


    getCustomers()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setCustomers(data);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load customers."
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
     REFRESH CUSTOMERS
  ========================= */

  async function refreshCustomers() {
    try {
      const data =
        await getCustomers();

      setCustomers(data);
      setError("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load customers.";

      setError(message);

      throw error;
    }
  }


  /* =========================
     CREATE CUSTOMER
  ========================= */

  async function handleCreateCustomer(
    customer: CustomerCreate
  ) {
    try {
      setCreating(true);
      setError("");

      await createCustomer(
        customer
      );

      await refreshCustomers();
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message
        );
      }

      throw error;
    } finally {
      setCreating(false);
    }
  }


  return {
    customers,
    loading,
    creating,
    error,

    handleCreateCustomer,
    refreshCustomers,
  };
}