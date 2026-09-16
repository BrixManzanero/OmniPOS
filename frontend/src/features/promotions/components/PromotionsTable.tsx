import {
  formatPeso,
} from "@/utils/formatters";

import type {
  Promotion,
  PromotionStatus,
} from "../types/promotion.types";


type Props = {
  promotions: Promotion[];

  onChangeStatus: (
    promotionId: number,
    status: PromotionStatus
  ) => Promise<void>;

  onDelete: (
    promotionId: number
  ) => Promise<void>;
};


function formatDiscount(
  promotion: Promotion
) {
  return promotion.discount_type ===
    "PERCENT"
    ? `${promotion.discount_value}% off`
    : `${formatPeso(
        promotion.discount_value
      )} off`;
}


function formatTarget(
  promotion: Promotion
) {
  if (
    promotion.target_type === "PRODUCT"
  ) {
    return (
      promotion.target_product_name ||
      "Selected product"
    );
  }

  if (
    promotion.target_type === "CATEGORY"
  ) {
    return (
      promotion.target_category ||
      "Selected category"
    );
  }

  return "All products";
}


function formatSchedule(
  promotion: Promotion
) {
  const parts: string[] = [];

  if (
    promotion.start_hour !== null &&
    promotion.end_hour !== null
  ) {
    parts.push(
      `${promotion.start_hour}:00 - ` +
        `${promotion.end_hour}:00 daily`
    );
  }

  if (promotion.end_date) {
    parts.push(
      `until ${new Date(
        promotion.end_date
      ).toLocaleDateString("en-PH")}`
    );
  }

  return parts.length
    ? parts.join(", ")
    : "No schedule limit";
}


function PromotionsTable({
  promotions,
  onChangeStatus,
  onDelete,
}: Props) {
  if (!promotions.length) {
    return (
      <p>
        No promotions yet.
      </p>
    );
  }


  return (
    <div className="inventory-table-wrapper">
      <table className="inventory-table">

        <thead>
          <tr>
            <th>Promotion</th>
            <th>Discount</th>
            <th>Applies To</th>
            <th>Channel</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>


        <tbody>
          {promotions.map(
            (promotion) => (
              <tr key={promotion.id}>

                <td>
                  <strong>
                    {promotion.name}
                  </strong>

                  {promotion.source ===
                    "AI" && (
                    <span className="badge">
                      AI
                    </span>
                  )}
                </td>


                <td>
                  {formatDiscount(
                    promotion
                  )}
                </td>


                <td>
                  {formatTarget(
                    promotion
                  )}
                </td>


                <td>
                  {promotion.channel ===
                  "ALL"
                    ? "POS + Online"
                    : promotion.channel}
                </td>


                <td>
                  {formatSchedule(
                    promotion
                  )}
                </td>


                <td>
                  <span
                    className={
                      promotion.is_live
                        ? "inventory-status"
                        : "inventory-status low"
                    }
                  >
                    {promotion.is_live
                      ? "Running"
                      : promotion.status}
                  </span>
                </td>


                <td className="inventory-actions">
                  {promotion.status !==
                    "ACTIVE" &&
                    promotion.status !==
                      "EXPIRED" && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          onChangeStatus(
                            promotion.id,
                            "ACTIVE"
                          )
                        }
                      >
                        Approve
                      </button>
                    )}


                  {promotion.status ===
                    "ACTIVE" && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onChangeStatus(
                          promotion.id,
                          "PAUSED"
                        )
                      }
                    >
                      Pause
                    </button>
                  )}


                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      onDelete(
                        promotion.id
                      )
                    }
                  >
                    Delete
                  </button>
                </td>

              </tr>
            )
          )}
        </tbody>

      </table>
    </div>
  );
}


export default PromotionsTable;
