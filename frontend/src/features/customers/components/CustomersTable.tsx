import type {
  Customer,
} from "../types/customer.types";


type Props = {
  customers: Customer[];

  onViewDetails:
    (customer: Customer) => void;
};


function CustomersTable({
  customers,
  onViewDetails,
}: Props) {

  if (customers.length === 0) {
    return (
      <div className="empty-state">

        <strong>
          No customers yet
        </strong>

        <span>
          Add your first customer to
          start building purchase history.
        </span>

      </div>
    );
  }


  return (
    <div className="inventory-table-wrapper">

      <table className="inventory-table">

        <thead>

          <tr>

            <th>
              Customer
            </th>

            <th>
              Phone
            </th>

            <th>
              Email
            </th>

            <th>
              Joined
            </th>

            <th>
              Status
            </th>

            <th>
              Action
            </th>

          </tr>

        </thead>


        <tbody>

          {customers.map(
            (customer) => {

              const joinedDate =
                new Date(
                  customer.created_at
                );


              return (
                <tr
                  key={customer.id}
                >

                  <td>

                    <strong>
                      {customer.name}
                    </strong>

                  </td>


                  <td>
                    {customer.phone || "—"}
                  </td>


                  <td>
                    {customer.email || "—"}
                  </td>


                  <td>

                    {joinedDate.toLocaleDateString(
                      "en-PH",
                      {
                        dateStyle:
                          "medium",
                      }
                    )}

                  </td>


                  <td>

                    <span
                      className={
                        "inventory-status healthy"
                      }
                    >
                      Active
                    </span>

                  </td>


                  <td>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onViewDetails(
                          customer
                        )
                      }
                    >
                      View Details
                    </button>

                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </div>
  );
}


export default CustomersTable;