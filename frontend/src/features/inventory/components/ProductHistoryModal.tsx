import type {
  InventoryMovement,
} from "@/services/api";

import type {
  Product,
} from "@/types/product";


type Props = {
  product: Product | null;
  movements: InventoryMovement[];
  onClose: () => void;
};


function ProductHistoryModal({
  product,
  movements,
  onClose,
}: Props) {
  if (!product) {
    return null;
  }


  const productMovements =
    movements.filter(
      (movement) =>
        movement.product_id === product.id
    );


  return (
    <div className="modal-backdrop">

      <div className="payment-modal order-modal">

        <div className="payment-modal-header">

          <div>
            <p className="page-eyebrow">
              Product History
            </p>

            <h2>
              {product.name}
            </h2>

            <p>
              Current stock:{" "}
              <strong>{product.stock}</strong>
            </p>
          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {productMovements.length === 0 ? (

          <div className="empty-state">
            <strong>
              No history yet
            </strong>

            <span>
              Future sales and restocks
              will appear here.
            </span>
          </div>

        ) : (

          <div className="inventory-table-wrapper">

            <table className="inventory-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>

                {productMovements.map(
                  (movement) => {

                    const isSale =
                      movement.movement_type
                      === "SALE";

                    const date =
                      new Date(
                        movement.created_at
                      );

                    return (
                      <tr key={movement.id}>

                        <td>
                          {date.toLocaleString(
                            "en-PH",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            }
                          )}
                        </td>


                        <td>
                          <span
                            className={
                              isSale
                                ? "movement-badge sale"
                                : "movement-badge restock"
                            }
                          >
                            {
                              movement
                                .movement_type
                            }
                          </span>
                        </td>


                        <td>
                          <strong
                            className={
                              isSale
                                ? "movement-negative"
                                : "movement-positive"
                            }
                          >
                            {
                              movement.quantity > 0
                                ? `+${movement.quantity}`
                                : movement.quantity
                            }
                          </strong>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


export default ProductHistoryModal;