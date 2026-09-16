import { useState } from "react";

import type { Product } from "@/types/product";


type Props = {
  product: Product | null;
  restocking: boolean;

  onClose: () => void;

  onRestock: (
    productId: number,
    quantity: number
  ) => Promise<void>;
};


function RestockModal({
  product,
  restocking,
  onClose,
  onRestock,
}: Props) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");


  if (!product) {
    return null;
  }


  const currentProduct = product;


  async function handleSubmit() {
    const amount = Number(quantity);

    if (!amount || amount <= 0) {
      setError(
        "Enter a valid restock quantity."
      );

      return;
    }


    try {
      setError("");

      await onRestock(
        currentProduct.id,
        amount
      );

      setQuantity("");

      onClose();

    } catch {
      setError(
        "Unable to restock product."
      );
    }
  }


  return (
    <div className="modal-backdrop">

      <div className="payment-modal">

        <div className="payment-modal-header">

          <div>
            <p className="page-eyebrow">
              Inventory
            </p>

            <h2>
              Restock Product
            </h2>
          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={restocking}
          >
            ×
          </button>

        </div>


        <div className="restock-product-info">

          <strong>
            {currentProduct.name}
          </strong>

          <span>
            Current Stock:{" "}
            {currentProduct.stock}
          </span>

        </div>


        <label className="restock-field">

          Quantity to Add

          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) =>
              setQuantity(
                event.target.value
              )
            }
            placeholder="Example: 20"
            disabled={restocking}
          />

        </label>


        {error && (
          <p className="error-message">
            {error}
          </p>
        )}


        <div className="payment-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={restocking}
          >
            Cancel
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={restocking}
          >
            {restocking
              ? "Restocking..."
              : "Confirm Restock"}
          </button>

        </div>

      </div>

    </div>
  );
}


export default RestockModal;