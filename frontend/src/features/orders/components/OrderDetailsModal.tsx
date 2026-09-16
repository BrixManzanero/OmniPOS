import type { Order } from "../types/order.types";
import { formatPeso } from "@/utils/formatters";


type Props = {
  order: Order | null;
  onClose: () => void;
};


function OrderDetailsModal({
  order,
  onClose,
}: Props) {
  if (!order) {
    return null;
  }


  const formattedDate =
    new Date(
      order.created_at
    ).toLocaleString(
      "en-PH",
      {
        dateStyle: "long",
        timeStyle: "short",
      }
    );


  const totalItems =
    order.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  const customerLabel =
    order.customer?.name ??
    "Walk-in Customer";


  return (
    <div className="modal-backdrop">

      <div className="payment-modal order-modal">


        {/* =========================
            HEADER
        ========================= */}

        <div className="payment-modal-header">

          <div>

            <p className="page-eyebrow">
              Transaction
            </p>

            <h2>
              Order #{order.id}
            </h2>

          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* =========================
            ORDER INFORMATION
        ========================= */}

        <div className="order-detail-meta">

          <div>

            <span>
              Customer
            </span>

            <strong>
              {customerLabel}
            </strong>

          </div>


          <div>

            <span>
              Channel
            </span>

            <strong>
              {order.order_channel}
            </strong>

          </div>


          <div>

            <span>
              Payment Method
            </span>

            <strong>
              {order.payment_method.toUpperCase()}
            </strong>

          </div>


          <div>

            <span>
              Status
            </span>

            <strong>
              {order.status}
            </strong>

          </div>


          <div>

            <span>
              Total Items
            </span>

            <strong>
              {totalItems}
            </strong>

          </div>


          <div>

            <span>
              Date
            </span>

            <strong>
              {formattedDate}
            </strong>

          </div>

        </div>


        {/* =========================
            ORDER ITEMS
        ========================= */}

        <div className="order-detail-items">

          {order.items.map(
            (item) => (

              <div
                key={item.id}
                className="order-detail-item"
              >

                <div>

                  <strong>
                    {item.product_name}
                  </strong>


                  <span>

                    {formatPeso(
                      item.unit_price
                    )}

                    {" × "}

                    {item.quantity}

                  </span>

                </div>


                <strong>

                  {formatPeso(
                    item.line_total
                  )}

                </strong>

              </div>

            )
          )}

        </div>


        {/* =========================
            TOTAL
        ========================= */}

        <div className="order-detail-total">

          <span>
            Total
          </span>

          <strong>
            {formatPeso(
              order.total_amount
            )}
          </strong>

        </div>


        {/* =========================
            CLOSE BUTTON
        ========================= */}

        <button
          type="button"
          className="primary-button"
          onClick={onClose}
        >
          Close
        </button>

      </div>

    </div>
  );
}


export default OrderDetailsModal;