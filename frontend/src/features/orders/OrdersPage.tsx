import { useState } from "react";

import type { Order } from "@/services/api";

import OrderCard from "./components/OrderCard";
import OrderDetailsModal from "./components/OrderDetailsModal";
import OrdersSummary from "./components/OrdersSummary";

import { useOrders } from "./hooks/useOrders";


function OrdersPage() {
  const {
    orders,
    loading,
    error,
    totalRevenue,
    completedOrders,
  } = useOrders();

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);


  if (loading) {
    return <p>Loading orders...</p>;
  }


  if (error) {
    return (
      <div>
        <h1>Orders</h1>
        <p>{error}</p>
      </div>
    );
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            Transactions
          </p>

          <h1>Orders</h1>

          <p>
            Review completed POS transactions
            and payment details.
          </p>
        </div>
      </div>

      <OrdersSummary
        totalOrders={orders.length}
        completedOrders={completedOrders}
        totalRevenue={totalRevenue}
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Order History</h2>

            <p>
              Latest transactions appear first.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="muted-text">
            No orders recorded yet.
          </p>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={
                  setSelectedOrder
                }
              />
            ))}
          </div>
        )}
      </section>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() =>
          setSelectedOrder(null)
        }
      />
    </div>
  );
}

export default OrdersPage;