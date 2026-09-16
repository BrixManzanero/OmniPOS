import {
  useState,
} from "react";

import type {
  Product,
} from "@/types/product";

import InventoryMovements
  from "./components/InventoryMovements";

import InventorySummary
  from "./components/InventorySummary";

import InventoryTable
  from "./components/InventoryTable";

import ProductHistoryModal
  from "./components/ProductHistoryModal";

import RestockModal
  from "./components/RestockModal";

import {
  useInventory,
} from "./hooks/useInventory";


function InventoryPage() {
  const {
    products,
    movements,
    loading,
    error,
    restocking,
    totalStock,
    lowStockProducts,
    outOfStockProducts,
    handleRestock,
  } = useInventory();


  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null
  );

  const [
    historyProduct,
    setHistoryProduct,
  ] = useState<Product | null>(
    null
  );


  if (loading) {
    return (
      <div className="page-section">
        <p>
          Loading inventory...
        </p>
      </div>
    );
  }


  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            Stock Management
          </p>

          <h1>
            Inventory
          </h1>

          <p className="page-description">
            Monitor product stock,
            transactions, and restocking
            history.
          </p>
        </div>
      </div>


      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      <InventorySummary
        totalProducts={
          products.length
        }
        totalStock={
          totalStock
        }
        lowStockCount={
          lowStockProducts.length
        }
        outOfStockCount={
          outOfStockProducts.length
        }
      />


      <div className="section-card">
        <div className="section-card-header">
          <div>
            <h2>
              Product Inventory
            </h2>

            <p>
              Current stock levels for
              all active products.
            </p>
          </div>
        </div>


        <InventoryTable
          products={products}
          onRestock={
            setSelectedProduct
          }
          onViewHistory={
            setHistoryProduct
          }
        />
      </div>


      <InventoryMovements
        movements={movements}
      />


      <RestockModal
        product={selectedProduct}
        restocking={restocking}
        onClose={() =>
          setSelectedProduct(null)
        }
        onRestock={
          handleRestock
        }
      />


      <ProductHistoryModal
        product={historyProduct}
        movements={movements}
        onClose={() =>
          setHistoryProduct(null)
        }
      />
    </div>
  );
}


export default InventoryPage;