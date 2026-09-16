type Props = {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
};

function InventorySummary({
  totalProducts,
  totalStock,
  lowStockCount,
  outOfStockCount,
}: Props) {
  return (
    <div className="dashboard-grid">

      <div className="metric-card">
        <span>Products</span>
        <strong>{totalProducts}</strong>
        <small>Active products</small>
      </div>

      <div className="metric-card">
        <span>Total Stock</span>
        <strong>{totalStock}</strong>
        <small>Units available</small>
      </div>

      <div className="metric-card">
        <span>Low Stock</span>
        <strong>{lowStockCount}</strong>
        <small>5 units or fewer</small>
      </div>

      <div className="metric-card">
        <span>Out of Stock</span>
        <strong>{outOfStockCount}</strong>
        <small>Needs restocking</small>
      </div>

    </div>
  );
}

export default InventorySummary;