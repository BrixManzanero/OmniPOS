import { useMemo, useState } from "react";

import { checkoutOrder } from "../orders/api/ordersApi";
import type { PaymentMethod } from "../orders/types/order.types";
import { useCart } from "@/shared/hooks/useCart";
import { useLiveProducts } from "@/shared/hooks/useLiveProducts";
import type { CartConflict } from "@/shared/types/cart.types";
import type { Product } from "@/types/product";

function describeConflict(conflict: CartConflict): string {
  return conflict.available > 0
    ? `Only ${conflict.available} left of ${conflict.productName} — another sale took the rest.`
    : `${conflict.productName} just sold out on another channel.`;
}

function POSPage() {
  // The till only sells what is on the shelf, so out-of-stock items are
  // hidden here. Polling means an online sale reaches this terminal.
  const {
    products,
    customers,
    loading,
    error: loadError,
    refresh,
  } = useLiveProducts({
    inStockOnly: true,
    withCustomers: true,
  });

  const cart = useCart(products);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  // A conflict outranks other messages: the cashier is about to take money
  // for stock that is no longer there, and needs to know before they do.
  const error = cart.hasConflicts
    ? describeConflict(cart.conflicts[0])
    : checkoutError || loadError;

  // The markup below still uses these names.
  const cartLines = cart.items;
  const totalItems = cart.count;
  const subtotal = cart.subtotal;
  const increaseQuantity = cart.increase;
  const decreaseQuantity = cart.decrease;
  const removeItem = cart.remove;
  const customersLoading = loading;

  function addToCart(product: Product) {
    setMessage("");
    cart.add(product);
  }

  function clearCart() {
    cart.clear();
    setMessage("");
    setCheckoutError("");
  }

  async function handleCheckout() {
    if (cart.isEmpty) {
      return;
    }

    // Trim to what is actually on hand rather than sending an order the
    // server will reject. The cashier can still ring up the rest.
    if (cart.hasConflicts) {
      cart.reconcile();
      setCheckoutError("Cart updated to match available stock. Review and retry.");
      return;
    }

    setProcessing(true);
    setCheckoutError("");
    setMessage("");

    try {
      const order = await checkoutOrder(
        paymentMethod,
        cart.checkoutItems,
        selectedCustomerId,
        "POS"
      );

      const customerLabel = selectedCustomer?.name ?? "Walk-in Customer";

      setMessage(
        `Sale completed! Order #${order.id} — ₱${order.total_amount.toFixed(
          2
        )} — ${customerLabel}`
      );

      cart.clear();
      setShowPayment(false);
      setPaymentMethod("cash");
      setSelectedCustomerId(null);

      await refresh();
    } catch (caught) {
      if (caught instanceof Error) {
        setCheckoutError(caught.message);
      }
    } finally {
      setProcessing(false);
    }
  }


  return (
    <div>

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Physical Store
          </p>

          <h1>
            Point of Sale
          </h1>

          <p>
            Create and manage walk-in
            and registered customer
            orders.
          </p>

        </div>


        <div className="header-stat">

          <span>
            Current Items
          </span>

          <strong>
            {totalItems}
          </strong>

        </div>

      </div>


      {/* =========================
          MESSAGES
      ========================= */}

      {message && (

        <div className="success-message">
          {message}
        </div>

      )}


      {error && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* =========================
          POS LAYOUT
      ========================= */}

      <div className="pos-layout">


        {/* PRODUCTS */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Product Catalog
              </h2>

              <p>
                Select an item to
                add it to the order.
              </p>

            </div>

          </div>


          {loading && (

            <p>
              Loading products...
            </p>

          )}


          {!loading &&
            products.length === 0 && (

              <p>
                No products available.
              </p>

            )}


          <div className="pos-product-grid">

            {products.map(
              (product) => (

                <button
                  key={product.id}
                  type="button"
                  className="pos-product-card"

                  onClick={() =>
                    addToCart(product)
                  }
                >

                  <span className="badge">

                    {product.category ||
                      "Uncategorized"}

                  </span>


                  <h3>
                    {product.name}
                  </h3>


                  <strong>
                    ₱
                    {product.price.toFixed(
                      2
                    )}
                  </strong>


                  <small>
                    {product.stock}
                    {" "}
                    available
                  </small>

                </button>

              )
            )}

          </div>

        </section>


        {/* =========================
            CART
        ========================= */}

        <aside className="panel cart-panel">

          <div className="cart-heading">

            <div>

              <h2>
                Current Order
              </h2>


              <p>
                {totalItems}{" "}
                item
                {totalItems !== 1
                  ? "s"
                  : ""}
              </p>

            </div>


            {cartLines.length > 0 && (

              <button
                type="button"
                className="text-button"
                onClick={clearCart}
              >
                Clear
              </button>

            )}

          </div>


          {cartLines.length === 0 ? (

            <div className="empty-cart">

              <strong>
                No items yet
              </strong>


              <span>
                Select a product
                to start an order.
              </span>

            </div>

          ) : (

            <div className="cart-items">

              {cartLines.map((item) => (

                <div
                  className="cart-item"
                  key={item.product.id}
                >

                  <div className="cart-item-info">

                    <strong>
                      {item.product.name}
                    </strong>


                    <span>
                      ₱
                      {item.product.price.toFixed(
                        2
                      )}
                    </span>

                  </div>


                  <div className="quantity-control">

                    <button
                      type="button"

                      onClick={() =>
                        decreaseQuantity(
                          item.product.id
                        )
                      }
                    >
                      −
                    </button>


                    <span>
                      {item.quantity}
                    </span>


                    <button
                      type="button"

                      onClick={() =>
                        increaseQuantity(
                          item.product.id
                        )
                      }

                      disabled={
                        item.quantity >=
                        item.product.stock
                      }
                    >
                      +
                    </button>

                  </div>


                  <strong className="line-total">

                    ₱
                    {(
                      item.product.price *
                      item.quantity
                    ).toFixed(2)}

                  </strong>


                  <button
                    type="button"
                    className="remove-button"

                    onClick={() =>
                      removeItem(
                        item.product.id
                      )
                    }
                  >
                    Remove
                  </button>

                </div>

              ))}

            </div>

          )}


          {/* =========================
              CART TOTAL
          ========================= */}

          <div className="cart-summary">

            <div>

              <span>
                Subtotal
              </span>

              <strong>
                ₱{subtotal.toFixed(2)}
              </strong>

            </div>


            <div className="cart-grand-total">

              <span>
                Total
              </span>

              <strong>
                ₱{subtotal.toFixed(2)}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="primary-button checkout-button"

            disabled={
              cartLines.length === 0
            }

            onClick={() =>
              setShowPayment(true)
            }
          >
            Proceed to Payment
          </button>

        </aside>

      </div>


      {/* =========================
          PAYMENT MODAL
      ========================= */}

      {showPayment && (

        <div className="modal-backdrop">

          <div className="payment-modal">


            {/* HEADER */}

            <div className="payment-modal-header">

              <div>

                <p className="page-eyebrow">
                  Checkout
                </p>

                <h2>
                  Complete Payment
                </h2>

              </div>


              <button
                type="button"
                className="modal-close"

                disabled={processing}

                onClick={() =>
                  setShowPayment(false)
                }
              >
                ×
              </button>

            </div>


            {/* AMOUNT */}

            <div className="payment-total">

              <span>
                Amount Due
              </span>

              <strong>
                ₱{subtotal.toFixed(2)}
              </strong>

            </div>


            {/* =========================
                CUSTOMER
            ========================= */}

            <div className="payment-section">

              <label htmlFor="pos-customer">
                Customer
              </label>


              <select
                id="pos-customer"

                className="customer-select"

                value={
                  selectedCustomerId ?? ""
                }

                disabled={
                  processing ||
                  customersLoading
                }

                onChange={(event) => {

                  const value =
                    event.target.value;


                  setSelectedCustomerId(
                    value === ""
                      ? null
                      : Number(value)
                  );

                }}
              >

                <option value="">
                  Walk-in Customer
                </option>


                {customers.map(
                  (customer) => (

                    <option
                      key={customer.id}
                      value={customer.id}
                    >

                      {customer.name}

                      {customer.phone
                        ? ` — ${customer.phone}`
                        : ""}

                    </option>

                  )
                )}

              </select>


              {customersLoading && (

                <small>
                  Loading customers...
                </small>

              )}


              {!customersLoading &&
                selectedCustomer && (

                  <small>
                    Order will be linked to{" "}
                    {selectedCustomer.name}.
                  </small>

                )}


              {!customersLoading &&
                !selectedCustomer && (

                  <small>
                    This order will be
                    recorded as a walk-in sale.
                  </small>

                )}

            </div>


            {/* =========================
                PAYMENT METHOD
            ========================= */}

            <div className="payment-section">

              <label>
                Payment Method
              </label>


              <div className="payment-methods">

                <button
                  type="button"

                  className={
                    paymentMethod === "cash"
                      ? "payment-method active"
                      : "payment-method"
                  }

                  disabled={processing}

                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                >
                  Cash
                </button>


                <button
                  type="button"

                  className={
                    paymentMethod === "gcash"
                      ? "payment-method active"
                      : "payment-method"
                  }

                  disabled={processing}

                  onClick={() =>
                    setPaymentMethod("gcash")
                  }
                >
                  GCash
                </button>


                <button
                  type="button"

                  className={
                    paymentMethod === "maya"
                      ? "payment-method active"
                      : "payment-method"
                  }

                  disabled={processing}

                  onClick={() =>
                    setPaymentMethod("maya")
                  }
                >
                  Maya
                </button>


                <button
                  type="button"

                  className={
                    paymentMethod === "card"
                      ? "payment-method active"
                      : "payment-method"
                  }

                  disabled={processing}

                  onClick={() =>
                    setPaymentMethod("card")
                  }
                >
                  Card
                </button>

              </div>

            </div>


            {/* =========================
                PAYMENT ACTIONS
            ========================= */}

            <div className="payment-actions">

              <button
                type="button"
                className="secondary-button"

                disabled={processing}

                onClick={() =>
                  setShowPayment(false)
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="primary-button"

                disabled={
                  processing ||
                  customersLoading
                }

                onClick={
                  handleCheckout
                }
              >

                {processing
                  ? "Processing..."
                  : "Complete Sale"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default POSPage;