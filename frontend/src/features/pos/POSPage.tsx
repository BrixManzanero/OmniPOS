import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkoutOrder,
} from "../orders/api/ordersApi";

import type {
  PaymentMethod,
} from "../orders/types/order.types";

import {
  getProducts,
} from "../products/api/productsApi";

import {
  getCustomers,
} from "../customers/api/customersApi";

import type {
  Customer,
} from "../customers/types/customer.types";

import type {
  Product,
} from "@/types/product";


type CartItem = {
  product: Product;
  quantity: number;
};


function POSPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [cart, setCart] =
    useState<CartItem[]>([]);


  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState<number | null>(null);


  const [loading, setLoading] =
    useState(true);

  const [
    customersLoading,
    setCustomersLoading,
  ] = useState(true);


  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  const [
    showPayment,
    setShowPayment,
  ] = useState(false);


  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>("cash");


  const [processing, setProcessing] =
    useState(false);


  /* =========================
     LOAD PRODUCTS
  ========================= */

  async function loadProducts() {
    try {
      const data =
        await getProducts();

      setProducts(
        data.filter(
          (product) =>
            product.is_active &&
            product.stock > 0
        )
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      }

    } finally {
      setLoading(false);
    }
  }


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;

    async function initializePos() {
      try {
        const [productData, customerData] = await Promise.all([
          getProducts(),
          getCustomers(),
        ]);

        if (cancelled) {
          return;
        }

        setProducts(
          productData.filter(
            (product) =>
              product.is_active &&
              product.stock > 0
          )
        );

        setCustomers(
          customerData.filter(
            (customer) => customer.is_active
          )
        );
      } catch (error) {
        if (!cancelled && error instanceof Error) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCustomersLoading(false);
        }
      }
    }

    void initializePos();

    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================
   ADD TO CART
========================= */

function addToCart(
  product: Product
) {
  setCart((currentCart) => {

    const existingItem =
      currentCart.find(
        (item) =>
          item.product.id ===
          product.id
      );


    // Product is already in the order.
    // Quantity must only be changed
    // using the + / - controls.
    if (existingItem) {
      return currentCart;
    }


    // Do not add unavailable products.
    if (product.stock <= 0) {
      return currentCart;
    }


    return [
      ...currentCart,
      {
        product,
        quantity: 1,
      },
    ];
  });
}


  /* =========================
     INCREASE QUANTITY
  ========================= */

  function increaseQuantity(
    productId: number
  ) {

    setCart((currentCart) =>
      currentCart.map((item) => {

        if (
          item.product.id !==
          productId
        ) {
          return item;
        }


        if (
          item.quantity >=
          item.product.stock
        ) {
          return item;
        }


        return {
          ...item,

          quantity:
            item.quantity + 1,
        };
      })
    );
  }


  /* =========================
     DECREASE QUANTITY
  ========================= */

  function decreaseQuantity(
    productId: number
  ) {

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id ===
          productId
            ? {
                ...item,

                quantity:
                  item.quantity - 1,
              }
            : item
        )

        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }


  /* =========================
     REMOVE ITEM
  ========================= */

  function removeItem(
    productId: number
  ) {

    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.product.id !==
          productId
      )
    );
  }


  /* =========================
     CLEAR CART
  ========================= */

  function clearCart() {
    setCart([]);
    setMessage("");
  }


  /* =========================
     TOTAL ITEMS
  ========================= */

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [cart]
  );


  /* =========================
     SUBTOTAL
  ========================= */

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0
      ),
    [cart]
  );


  /* =========================
     SELECTED CUSTOMER
  ========================= */

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (customer) =>
            customer.id ===
            selectedCustomerId
        ) ?? null,

      [
        customers,
        selectedCustomerId,
      ]
    );


  /* =========================
     CHECKOUT
  ========================= */

  async function handleCheckout() {

    if (cart.length === 0) {
      return;
    }


    setProcessing(true);

    setError("");
    setMessage("");


    try {

      const order =
        await checkoutOrder(
          paymentMethod,

          cart.map((item) => ({
            product_id:
              item.product.id,

            quantity:
              item.quantity,
          })),

          selectedCustomerId,

          "POS"
        );


      const customerLabel =
        selectedCustomer
          ? selectedCustomer.name
          : "Walk-in Customer";


      setMessage(
        `Sale completed! Order #${order.id} — ₱${order.total_amount.toFixed(
          2
        )} — ${customerLabel}`
      );


      setCart([]);

      setShowPayment(false);

      setPaymentMethod("cash");

      setSelectedCustomerId(null);


      await loadProducts();

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
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


            {cart.length > 0 && (

              <button
                type="button"
                className="text-button"
                onClick={clearCart}
              >
                Clear
              </button>

            )}

          </div>


          {cart.length === 0 ? (

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

              {cart.map((item) => (

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
              cart.length === 0
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