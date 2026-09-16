import {
  useState,
} from "react";

import type {
  CustomerCreate,
} from "../types/customer.types";


type Props = {
  open: boolean;
  creating: boolean;

  onClose: () => void;

  onCreate: (
    customer: CustomerCreate
  ) => Promise<void>;
};


function AddCustomerModal({
  open,
  creating,
  onClose,
  onCreate,
}: Props) {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");


  if (!open) {
    return null;
  }


  async function handleSubmit() {
    if (!name.trim()) {
      setError(
        "Customer name is required."
      );

      return;
    }


    try {
      setError("");

      await onCreate({
        name: name.trim(),
        phone:
          phone.trim() || null,
        email:
          email.trim() || null,
      });


      setName("");
      setPhone("");
      setEmail("");

      onClose();

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }


  return (
    <div className="modal-backdrop">

      <div className="payment-modal">

        <div className="payment-modal-header">

          <div>
            <p className="page-eyebrow">
              Customer Management
            </p>

            <h2>
              Add Customer
            </h2>
          </div>


          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={creating}
          >
            ×
          </button>

        </div>


        <div className="customer-form">

          <label>
            Customer Name

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Example: John Cruz"
            />
          </label>


          <label>
            Phone Number

            <input
              type="text"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              placeholder="09171234567"
            />
          </label>


          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="john@example.com"
            />
          </label>

        </div>


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
            disabled={creating}
          >
            Cancel
          </button>


          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={creating}
          >
            {creating
              ? "Creating..."
              : "Add Customer"}
          </button>

        </div>

      </div>

    </div>
  );
}


export default AddCustomerModal;