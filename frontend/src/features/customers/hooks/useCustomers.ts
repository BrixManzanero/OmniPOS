import {
  useEffect,
  useState,
} from "react";

import {
  createCustomer,
  getCustomers,
} from "@/services/api";

import type {
  Customer,
  CustomerCreate,
} from "@/services/api";


export function useCustomers() {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");


  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getCustomers();

      setCustomers(data);

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    let cancelled = false;

    async function initializeCustomers() {
      try {
        const data = await getCustomers();

        if (!cancelled) {
          setCustomers(data);
        }
      } catch (error) {
        if (!cancelled && error instanceof Error) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeCustomers();

    return () => {
      cancelled = true;
    };
  }, []);


  async function handleCreateCustomer(
    customer: CustomerCreate
  ) {
    try {
      setCreating(true);
      setError("");

      await createCustomer(customer);

      await loadCustomers();

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
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
    refreshCustomers: loadCustomers,
  };
}