import type {
  InventoryMovement,
} from "../types/inventory.types";


type Props = {
  movements: InventoryMovement[];
};


function InventoryMovements({
  movements,
}: Props) {
  return (
    <div className="section-card">

      <div className="section-card-header">
        <div>
          <h2>
            Stock Movement History
          </h2>

          <p>
            Recent sales and restock activity.
          </p>
        </div>
      </div>


      {movements.length === 0 ? (
        <div className="empty-state">
          <strong>
            No stock movements yet
          </strong>

          <span>
            Sales and restocks will appear here.
          </span>
        </div>
      ) : (
        <div className="inventory-table-wrapper">

          <table className="inventory-table">

            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement) => {
                const isSale =
                  movement.movement_type === "SALE";

                const date =
                  new Date(movement.created_at);

                return (
                  <tr key={movement.id}>

                    <td>
                      <strong>
                        {movement.product_name}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          isSale
                            ? "movement-badge sale"
                            : "movement-badge restock"
                        }
                      >
                        {movement.movement_type}
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
                        {movement.quantity > 0
                          ? `+${movement.quantity}`
                          : movement.quantity}
                      </strong>
                    </td>

                    <td>
                      {date.toLocaleString(
                        "en-PH",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}


export default InventoryMovements;