import {
  useEffect,
  useState,
} from "react";

import type {
  Customer,
  CustomerHistory,
} from "@/services/api";

import {
  getCustomerHistory,
} from "@/services/api";

import {
  formatPeso,
} from "@/utils/formatters";


type Props = {
  customer: Customer | null;
  onClose: () => void;
};


function CustomerDetailsModal({
  customer,
  onClose,
}: Props) {
  const [
    history,
    setHistory,
  ] = useState<CustomerHistory | null>(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  useEffect(() => {
    if (!customer) {
      return;
    }


    let cancelled = false;


    async function loadHistory() {
      setLoading(true);
      setError(null);
      setHistory(null);


      try {
        const data =
          await getCustomerHistory(
            customer!.id
          );


        if (!cancelled) {
          setHistory(data);
        }

      } catch (err) {
        if (!cancelled) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError(
              "Failed to load customer history."
            );
          }
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    loadHistory();


    return () => {
      cancelled = true;
    };

  }, [customer]);


  if (!customer) {
    return null;
  }


  const formatPurchaseDate = (
    value: string | null
  ) => {
    if (!value) {
      return "No purchases yet";
    }


    return new Date(
      value
    ).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  return (
    <div className="modal-backdrop">

      <div className="payment-modal order-modal">

        {/* HEADER */}

        <div className="payment-modal-header">

          <div>

            <p className="page-eyebrow">
              Customer Profile
            </p>

            <h2>
              {customer.name}
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


        {/* CONTACT INFORMATION */}

        <div className="order-detail-meta">

          <div>
            <span>
              Phone
            </span>

            <strong>
              {customer.phone || "—"}
            </strong>
          </div>


          <div>
            <span>
              Email
            </span>

            <strong>
              {customer.email || "—"}
            </strong>
          </div>


          <div>
            <span>
              Customer ID
            </span>

            <strong>
              #{customer.id}
            </strong>
          </div>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="empty-state">

            <strong>
              Loading customer history...
            </strong>

            <span>
              Retrieving purchase information.
            </span>

          </div>
        )}


        {/* ERROR */}

        {!loading && error && (
          <p className="error-message">
            {error}
          </p>
        )}


        {/* HISTORY */}

        {!loading &&
          !error &&
          history && (
            <>

              <div className="order-detail-meta">

                <div>
                  <span>
                    Total Orders
                  </span>

                  <strong>
                    {history.summary.total_orders}
                  </strong>
                </div>


                <div>
                  <span>
                    Total Spent
                  </span>

                  <strong>
                    {formatPeso(
                      history.summary.total_spent
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Average Order
                  </span>

                  <strong>
                    {formatPeso(
                      history.summary
                        .average_order_value
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Customer Type
                  </span>

                  <strong>
                    {history.summary
                      .returning_customer
                      ? "Returning Customer"
                      : history.summary.total_orders > 0
                        ? "New Customer"
                        : "No Purchases Yet"}
                  </strong>
                </div>


                <div>
                  <span>
                    POS Orders
                  </span>

                  <strong>
                    {history.summary.pos_orders}
                  </strong>
                </div>


                <div>
                  <span>
                    Online Orders
                  </span>

                  <strong>
                    {history.summary.online_orders}
                  </strong>
                </div>


                <div>
                  <span>
                    First Purchase
                  </span>

                  <strong>
                    {formatPurchaseDate(
                      history.summary.first_purchase
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Last Purchase
                  </span>

                  <strong>
                    {formatPurchaseDate(
                      history.summary.last_purchase
                    )}
                  </strong>
                </div>

              </div>


              {/* PURCHASE HISTORY */}

              <div className="section-card-header">

                <div>

                  <p className="page-eyebrow">
                    Purchase History
                  </p>

                  <h3>
                    Transactions
                  </h3>

                </div>

              </div>


              {history.orders.length === 0 ? (
                <div className="empty-state">

                  <strong>
                    No purchases yet
                  </strong>

                  <span>
                    This customer has no
                    completed transactions.
                  </span>

                </div>
              ) : (
                <div className="order-detail-items">

                  {history.orders.map(
                    (order) => {
                      const orderDate =
                        new Date(
                          order.created_at
                        ).toLocaleString(
                          "en-PH",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        );


                      return (
                        <div
                          key={order.id}
                          className="order-detail-item"
                        >

                          <div>

                            <strong>
                              Order #{order.id}
                            </strong>


                            <span>
                              {order.order_channel}

                              {" • "}

                              {order.payment_method
                                .toUpperCase()}

                              {" • "}

                              {orderDate}
                            </span>

                          </div>


                          <strong>
                            {formatPeso(
                              order.total_amount
                            )}
                          </strong>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </>
          )}


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


export default CustomerDetailsModal;