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

import {
  formatPeso,
} from "@/utils/formatters";


type CartItem = {
  product: Product;
  quantity: number;
};


async function fetchStoreData() {
  const [
    productData,
    customerData,
  ] = await Promise.all([
    getProducts(),
    getCustomers(),
  ]);

  return {
    products:
      productData.filter(
        (product) =>
          product.is_active
      ),

    customers:
      customerData.filter(
        (customer) =>
          customer.is_active
      ),
  };
}


function StorePage() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [
    cart,
    setCart,
  ] = useState<Record<number, number>>(
    {}
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    showCart,
    setShowCart,
  ] = useState(false);

  const [
    checkingOut,
    setCheckingOut,
  ] = useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] = useState<string | null>(
    null
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null
  );

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState<number | null>(
    null
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>(
    "gcash"
  );


  /* =========================
     INITIAL STORE LOAD
  ========================= */

  useEffect(() => {
    let cancelled = false;


    fetchStoreData()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setProducts(
          data.products
        );

        setCustomers(
          data.customers
        );
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load the online store."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });


    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================
     REFRESH STORE DATA
  ========================= */

  async function refreshStoreData() {
    try {
      const data =
        await fetchStoreData();

      setProducts(
        data.products
      );

      setCustomers(
        data.customers
      );

      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to refresh the online store."
      );
    }
  }


  /* =========================
     CART DATA
  ========================= */

  const cartItems =
    useMemo<CartItem[]>(() => {
      return products
        .filter(
          (product) =>
            (
              cart[product.id] || 0
            ) > 0
        )
        .map(
          (product) => ({
            product,
            quantity:
              cart[product.id] || 0,
          })
        );
    }, [
      products,
      cart,
    ]);


  const totalCartItems =
    useMemo(() => {
      return cartItems.reduce(
        (total, item) =>
          total +
          item.quantity,
        0
      );
    }, [cartItems]);


  const cartTotal =
    useMemo(() => {
      return cartItems.reduce(
        (total, item) =>
          total +
          (
            item.product.price *
            item.quantity
          ),
        0
      );
    }, [cartItems]);


  /* =========================
     ADD TO CART
  ========================= */

  function addToCart(
    product: Product
  ) {
    setSuccessMessage(null);

    setCart(
      (currentCart) => {
        const currentQuantity =
          currentCart[
            product.id
          ] || 0;

        if (
          currentQuantity >=
          product.stock
        ) {
          return currentCart;
        }

        return {
          ...currentCart,

          [product.id]:
            currentQuantity + 1,
        };
      }
    );
  }


  /* =========================
     INCREASE QUANTITY
  ========================= */

  function increaseQuantity(
    product: Product
  ) {
    setCart(
      (currentCart) => {
        const currentQuantity =
          currentCart[
            product.id
          ] || 0;

        if (
          currentQuantity >=
          product.stock
        ) {
          return currentCart;
        }

        return {
          ...currentCart,

          [product.id]:
            currentQuantity + 1,
        };
      }
    );
  }


  /* =========================
     DECREASE QUANTITY
  ========================= */

  function decreaseQuantity(
    productId: number
  ) {
    setCart(
      (currentCart) => {
        const currentQuantity =
          currentCart[
            productId
          ] || 0;

        if (
          currentQuantity <= 1
        ) {
          const updatedCart = {
            ...currentCart,
          };

          delete updatedCart[
            productId
          ];

          return updatedCart;
        }

        return {
          ...currentCart,

          [productId]:
            currentQuantity - 1,
        };
      }
    );
  }


  /* =========================
     REMOVE FROM CART
  ========================= */

  function removeFromCart(
    productId: number
  ) {
    setCart(
      (currentCart) => {
        const updatedCart = {
          ...currentCart,
        };

        delete updatedCart[
          productId
        ];

        return updatedCart;
      }
    );
  }


  /* =========================
     ONLINE CHECKOUT
  ========================= */

  async function handleCheckout() {
    if (
      cartItems.length === 0
    ) {
      setCheckoutError(
        "Your cart is empty."
      );

      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);
    setSuccessMessage(null);


    try {
      const order =
        await checkoutOrder(
          paymentMethod,

          cartItems.map(
            (item) => ({
              product_id:
                item.product.id,

              quantity:
                item.quantity,
            })
          ),

          selectedCustomerId,

          "ONLINE"
        );


      const selectedCustomer =
        customers.find(
          (customer) =>
            customer.id ===
            selectedCustomerId
        );


      const customerLabel =
        selectedCustomer?.name ??
        "Guest Customer";


      setSuccessMessage(
        `Online order #${order.id} placed successfully for ${customerLabel}.`
      );


      setCart({});

      setSelectedCustomerId(
        null
      );

      setPaymentMethod(
        "gcash"
      );

      setShowCart(false);


      await refreshStoreData();
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Online checkout failed."
      );
    } finally {
      setCheckingOut(false);
    }
  }


  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="store-page">
        <p>
          Loading online store...
        </p>
      </main>
    );
  }


  return (
    <main className="store-page">
      {/* =========================
          STORE HEADER
      ========================= */}

      <header className="store-header">
        <div>
          <span className="store-brand">
            OmniPOS
          </span>

          <h1>
            Demo Restaurant
          </h1>

          <p>
            Order directly from the restaurant.
          </p>
        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            setShowCart(true)
          }
        >
          Cart · {totalCartItems}
        </button>
      </header>


      {/* =========================
          SUCCESS MESSAGE
      ========================= */}

      {successMessage && (
        <div className="store-success-message">
          {successMessage}
        </div>
      )}


      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      {/* =========================
          DIRECT ORDER BANNER
      ========================= */}

      <section className="direct-order-banner">
        <span>
          Direct Order
        </span>

        <strong>
          Order online through OmniPOS
        </strong>

        <p>
          Online orders use the same
          restaurant inventory as
          physical POS transactions.
        </p>
      </section>


      {/* =========================
          MENU
      ========================= */}

      <section className="store-menu-section">
        <div className="store-section-header">
          <div>
            <p className="page-eyebrow">
              Online Menu
            </p>

            <h2>
              Menu
            </h2>
          </div>


          <span className="muted-text">
            {products.length} products
          </span>
        </div>


        {products.length === 0 ? (
          <div className="empty-state">
            <strong>
              No products available
            </strong>

            <span>
              Products will appear here
              when they are available.
            </span>
          </div>
        ) : (
          <div className="store-product-grid">
            {products.map(
              (product) => {
                const quantityInCart =
                  cart[
                    product.id
                  ] || 0;

                const outOfStock =
                  product.stock <= 0;


                return (
                  <article
                    key={product.id}
                    className="store-product-card"
                  >
                    <div className="store-product-info">
                      <span className="page-eyebrow">
                        {
                          product.category ||
                          "Menu Item"
                        }
                      </span>


                      <h3>
                        {product.name}
                      </h3>


                      <p className="muted-text">
                        Available stock:{" "}
                        {product.stock}
                      </p>
                    </div>


                    <div className="store-product-footer">
                      <strong className="store-product-price">
                        {formatPeso(
                          product.price
                        )}
                      </strong>


                      {quantityInCart >
                      0 ? (
                        <div className="store-quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                product.id
                              )
                            }
                          >
                            −
                          </button>


                          <span>
                            {
                              quantityInCart
                            }
                          </span>


                          <button
                            type="button"
                            disabled={
                              quantityInCart >=
                              product.stock
                            }
                            onClick={() =>
                              increaseQuantity(
                                product
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          disabled={
                            outOfStock
                          }
                          onClick={() =>
                            addToCart(
                              product
                            )
                          }
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>


      {/* =========================
          CART / CHECKOUT MODAL
      ========================= */}

      {showCart && (
        <div className="modal-backdrop">
          <div className="payment-modal store-cart-modal">
            {/* HEADER */}

            <div className="payment-modal-header">
              <div>
                <p className="page-eyebrow">
                  Online Order
                </p>

                <h2>
                  Your Cart
                </h2>
              </div>


              <button
                type="button"
                className="modal-close"
                disabled={
                  checkingOut
                }
                onClick={() =>
                  setShowCart(false)
                }
              >
                ×
              </button>
            </div>


            {/* EMPTY CART */}

            {cartItems.length === 0 ? (
              <div className="empty-state">
                <strong>
                  Your cart is empty
                </strong>

                <span>
                  Add menu items before
                  checking out.
                </span>
              </div>
            ) : (
              <>
                {/* CART ITEMS */}

                <div className="order-detail-items">
                  {cartItems.map(
                    (item) => (
                      <div
                        key={
                          item.product.id
                        }
                        className="order-detail-item"
                      >
                        <div>
                          <strong>
                            {
                              item
                                .product
                                .name
                            }
                          </strong>

                          <span>
                            {formatPeso(
                              item.product
                                .price
                            )}

                            {" × "}

                            {
                              item.quantity
                            }
                          </span>
                        </div>


                        <div className="store-cart-item-actions">
                          <strong>
                            {formatPeso(
                              item.product
                                .price *
                                item.quantity
                            )}
                          </strong>


                          <button
                            type="button"
                            className="store-remove-button"
                            disabled={
                              checkingOut
                            }
                            onClick={() =>
                              removeFromCart(
                                item.product
                                  .id
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>


                {/* TOTAL */}

                <div className="order-detail-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPeso(
                      cartTotal
                    )}
                  </strong>
                </div>


                {/* CUSTOMER */}

                <div className="payment-section">
                  <label
                    htmlFor="online-customer"
                  >
                    Customer
                  </label>


                  <select
                    id="online-customer"
                    className="customer-select"
                    value={
                      selectedCustomerId ??
                      ""
                    }
                    disabled={
                      checkingOut
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value;

                      setSelectedCustomerId(
                        value
                          ? Number(
                              value
                            )
                          : null
                      );
                    }}
                  >
                    <option value="">
                      Guest Customer
                    </option>


                    {customers.map(
                      (customer) => (
                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {
                            customer.name
                          }

                          {customer.phone
                            ? ` · ${customer.phone}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>


                  <small>
                    Guest orders are recorded
                    without a registered
                    customer profile.
                  </small>
                </div>


                {/* PAYMENT */}

                <div className="payment-section">
                  <span>
                    Payment Method
                  </span>


                  <div className="payment-method-grid">
                    <button
                      type="button"
                      className={
                        paymentMethod ===
                        "gcash"
                          ? "payment-method active"
                          : "payment-method"
                      }
                      disabled={
                        checkingOut
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "gcash"
                        )
                      }
                    >
                      GCash
                    </button>


                    <button
                      type="button"
                      className={
                        paymentMethod ===
                        "maya"
                          ? "payment-method active"
                          : "payment-method"
                      }
                      disabled={
                        checkingOut
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "maya"
                        )
                      }
                    >
                      Maya
                    </button>


                    <button
                      type="button"
                      className={
                        paymentMethod ===
                        "card"
                          ? "payment-method active"
                          : "payment-method"
                      }
                      disabled={
                        checkingOut
                      }
                      onClick={() =>
                        setPaymentMethod(
                          "card"
                        )
                      }
                    >
                      Card
                    </button>
                  </div>


                  <small>
                    Development checkout only.
                    No real payment is processed.
                  </small>
                </div>


                {/* CHECKOUT ERROR */}

                {checkoutError && (
                  <p className="error-message">
                    {
                      checkoutError
                    }
                  </p>
                )}


                {/* CHECKOUT */}

                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    checkingOut ||
                    cartItems.length ===
                      0
                  }
                  onClick={
                    handleCheckout
                  }
                >
                  {checkingOut
                    ? "Placing Order..."
                    : `Place Online Order · ${formatPeso(
                        cartTotal
                      )}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}


export default StorePage;