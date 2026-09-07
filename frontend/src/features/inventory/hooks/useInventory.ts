import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getInventory,
  getInventoryMovements,
  restockProduct,
} from "../api/inventoryApi";

import type {
  InventoryMovement,
} from "../types/inventory.types";

import type {
  Product,
} from "@/types/product";


async function fetchInventoryData() {
  const [
    products,
    movements,
  ] = await Promise.all([
    getInventory(),
    getInventoryMovements(),
  ]);

  return {
    products,
    movements,
  };
}


export function useInventory() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [movements, setMovements] =
    useState<InventoryMovement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [restocking, setRestocking] =
    useState(false);


  useEffect(() => {
    let cancelled = false;


    fetchInventoryData()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setProducts(data.products);
        setMovements(data.movements);
      })
      .catch((error) => {
        if (
          !cancelled &&
          error instanceof Error
        ) {
          setError(error.message);
        }
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


  async function refreshInventory() {
    try {
      const data =
        await fetchInventoryData();

      setProducts(data.products);
      setMovements(data.movements);
      setError("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }

      throw error;
    }
  }


  async function handleRestock(
    productId: number,
    quantity: number
  ) {
    try {
      setRestocking(true);
      setError("");

      await restockProduct({
        product_id: productId,
        quantity,
      });

      await refreshInventory();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }

      throw error;
    } finally {
      setRestocking(false);
    }
  }


  const totalStock =
    useMemo(
      () =>
        products.reduce(
          (total, product) =>
            total + product.stock,
          0
        ),
      [products]
    );


  const lowStockProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.stock > 0 &&
            product.stock <= 5
        ),
      [products]
    );


  const outOfStockProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.stock === 0
        ),
      [products]
    );


  return {
    products,
    movements,

    loading,
    error,
    restocking,

    totalStock,
    lowStockProducts,
    outOfStockProducts,

    handleRestock,
    refreshInventory,
  };
}