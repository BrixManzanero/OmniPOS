import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getInventory,
  getInventoryMovements,
  restockProduct,
} from "@/services/api";

import type {
  InventoryMovement,
} from "@/services/api";

import type {
  Product,
} from "@/types/product";


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


  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryData,
        movementData,
      ] = await Promise.all([
        getInventory(),
        getInventoryMovements(),
      ]);

      setProducts(inventoryData);
      setMovements(movementData);

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

    async function initializeInventory() {
      try {
        const [inventoryData, movementData] = await Promise.all([
          getInventory(),
          getInventoryMovements(),
        ]);

        if (!cancelled) {
          setProducts(inventoryData);
          setMovements(movementData);
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

    void initializeInventory();

    return () => {
      cancelled = true;
    };
  }, []);


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

      await loadInventory();

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }

      throw error;

    } finally {
      setRestocking(false);
    }
  }


  const totalStock = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + product.stock,
      0
    );
  }, [products]);


  const lowStockProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.stock > 0 &&
          product.stock <= 5
      );
    }, [products]);


  const outOfStockProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.stock === 0
      );
    }, [products]);


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
    refreshInventory:
      loadInventory,
  };
}