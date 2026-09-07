import {
  useMemo,
  useState,
} from "react";

import type {
  Customer,
} from "@/services/api";

import CustomersSummary
  from "./components/CustomersSummary";

import CustomersTable
  from "./components/CustomersTable";

import AddCustomerModal
  from "./components/AddCustomerModal";

import CustomerDetailsModal
  from "./components/CustomerDetailsModal";

import {
  useCustomers,
} from "./hooks/useCustomers";


function CustomersPage() {
  const {
    customers,
    loading,
    creating,
    error,
    handleCreateCustomer,
  } = useCustomers();


  const [
    showAddCustomer,
    setShowAddCustomer,
  ] = useState(false);


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(null);


  const withPhone =
    useMemo(() => {
      return customers.filter(
        (customer) =>
          Boolean(customer.phone)
      ).length;
    }, [customers]);


  const withEmail =
    useMemo(() => {
      return customers.filter(
        (customer) =>
          Boolean(customer.email)
      ).length;
    }, [customers]);


  if (loading) {
    return (
      <div className="page-section">
        <p>
          Loading customers...
        </p>
      </div>
    );
  }


  return (
    <div className="page-section">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <p className="page-eyebrow">
            Customer Management
          </p>

          <h1>
            Customers
          </h1>

          <p className="page-description">
            Manage customer profiles,
            purchase history, and
            retention activity.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowAddCustomer(true)
          }
        >
          Add Customer
        </button>

      </div>


      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      {/* =========================
          CUSTOMER SUMMARY
      ========================= */}

      <CustomersSummary
        totalCustomers={
          customers.length
        }
        withPhone={
          withPhone
        }
        withEmail={
          withEmail
        }
      />


      {/* =========================
          CUSTOMER DIRECTORY
      ========================= */}

      <div className="section-card">

        <div className="section-card-header">

          <div>

            <h2>
              Customer Directory
            </h2>

            <p>
              Registered customers
              in OmniPOS.
            </p>

          </div>

        </div>


        <CustomersTable
          customers={
            customers
          }
          onViewDetails={
            setSelectedCustomer
          }
        />

      </div>


      {/* =========================
          ADD CUSTOMER MODAL
      ========================= */}

      <AddCustomerModal
        open={
          showAddCustomer
        }
        creating={
          creating
        }
        onClose={() =>
          setShowAddCustomer(false)
        }
        onCreate={
          handleCreateCustomer
        }
      />


      {/* =========================
          CUSTOMER DETAILS MODAL
      ========================= */}

      <CustomerDetailsModal
        customer={
          selectedCustomer
        }
        onClose={() =>
          setSelectedCustomer(null)
        }
      />

    </div>
  );
}


export default CustomersPage;