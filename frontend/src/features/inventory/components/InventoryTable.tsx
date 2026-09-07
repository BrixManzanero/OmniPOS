import type {
  Product,
} from "@/types/product";


type Props = {
  products: Product[];

  onRestock: (
    product: Product
  ) => void;

  onViewHistory: (
    product: Product
  ) => void;
};


function InventoryTable({
  products,
  onRestock,
  onViewHistory,
}: Props) {
  return (
    <div className="inventory-table-wrapper">

      <table className="inventory-table">

        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>


        <tbody>

          {products.map((product) => {

            let status = "Healthy";

            if (product.stock === 0) {
              status = "Out of Stock";
            } else if (product.stock <= 5) {
              status = "Low Stock";
            }


            return (
              <tr key={product.id}>

                <td>
                  <strong>
                    {product.name}
                  </strong>
                </td>


                <td>
                  {product.sku}
                </td>


                <td>
                  {product.category ||
                    "Uncategorized"}
                </td>


                <td>
                  <strong>
                    {product.stock}
                  </strong>
                </td>


                <td>
                  <span
                    className={`inventory-status ${
                      product.stock === 0
                        ? "out"
                        : product.stock <= 5
                        ? "low"
                        : "healthy"
                    }`}
                  >
                    {status}
                  </span>
                </td>


                <td>
                  <div className="inventory-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onViewHistory(
                          product
                        )
                      }
                    >
                      View History
                    </button>


                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onRestock(
                          product
                        )
                      }
                    >
                      Restock
                    </button>

                  </div>
                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}


export default InventoryTable;