import type { Order } from "@/services/api";
import { formatPeso } from "@/utils/formatters";


type Props = {
  order: Order;
  onViewDetails: (order: Order) => void;
};


function OrderCard({
  order,
  onViewDetails,
}: Props) {

  const formattedDate =
    new Date(
      order.created_at
    ).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
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
    <article className="order-card">

      {/* =========================
          HEADER
      ========================= */}

      <div className="order-card-header">

        <div>

          <span className="page-eyebrow">
            Order #{order.id}
          </span>

          <h3>
            {formatPeso(
              order.total_amount
            )}
          </h3>

        </div>


        <span className="order-status">
          {order.status}
        </span>

      </div>


      {/* =========================
          ORDER INFORMATION
      ========================= */}

      <div className="order-meta">

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
            Payment
          </span>

          <strong>
            {order.payment_method.toUpperCase()}
          </strong>
        </div>


        <div>
          <span>
            Items
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
          VIEW DETAILS
      ========================= */}

      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          onViewDetails(order)
        }
      >
        View Details
      </button>

    </article>
  );
}


export default OrderCard;