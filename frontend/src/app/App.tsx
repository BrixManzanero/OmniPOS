import {
  lazy,
  Suspense,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout
  from "@/components/layout/AppLayout";

import RouteFallback
  from "@/app/RouteFallback";


/* =========================
   LAZY-LOADED PAGES
========================= */

const DashboardPage = lazy(
  () =>
    import(
      "@/features/dashboard/DashboardPage"
    )
);


const AnalyticsPage = lazy(
  () =>
    import(
      "@/features/analytics/AnalyticsPage"
    )
);


const POSPage = lazy(
  () =>
    import(
      "@/features/pos/POSPage"
    )
);


const ProductsPage = lazy(
  () =>
    import(
      "@/features/products/ProductsPage"
    )
);


const StorePage = lazy(
  () =>
    import(
      "@/features/store/StorePage"
    )
);


const InventoryPage = lazy(
  () =>
    import(
      "@/features/inventory/InventoryPage"
    )
);


const OrdersPage = lazy(
  () =>
    import(
      "@/features/orders/OrdersPage"
    )
);


const CustomersPage = lazy(
  () =>
    import(
      "@/features/customers/CustomersPage"
    )
);


function App() {
  return (
    <Suspense
      fallback={
        <RouteFallback />
      }
    >
      <Routes>

        {/* =========================
            DEFAULT ROUTE
        ========================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =========================
            ADMIN / POS LAYOUT
        ========================= */}

        <Route
          element={
            <AppLayout />
          }
        >

          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />


          <Route
            path="/pos"
            element={
              <POSPage />
            }
          />


          <Route
            path="/products"
            element={
              <ProductsPage />
            }
          />


          <Route
            path="/orders"
            element={
              <OrdersPage />
            }
          />


          <Route
            path="/inventory"
            element={
              <InventoryPage />
            }
          />


          <Route
            path="/customers"
            element={
              <CustomersPage />
            }
          />


          <Route
            path="/analytics"
            element={
              <AnalyticsPage />
            }
          />

        </Route>


        {/* =========================
            PUBLIC ONLINE STORE
        ========================= */}

        <Route
          path="/store"
          element={
            <StorePage />
          }
        />

      </Routes>
    </Suspense>
  );
}


export default App;