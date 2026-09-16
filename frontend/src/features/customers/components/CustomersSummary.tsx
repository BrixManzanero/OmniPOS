type Props = {
  totalCustomers: number;
  withPhone: number;
  withEmail: number;
};


function CustomersSummary({
  totalCustomers,
  withPhone,
  withEmail,
}: Props) {
  return (
    <div className="dashboard-grid">

      <div className="metric-card">
        <span>Total Customers</span>

        <strong>
          {totalCustomers}
        </strong>

        <small>
          Registered customers
        </small>
      </div>


      <div className="metric-card">
        <span>With Phone</span>

        <strong>
          {withPhone}
        </strong>

        <small>
          Contactable by phone
        </small>
      </div>


      <div className="metric-card">
        <span>With Email</span>

        <strong>
          {withEmail}
        </strong>

        <small>
          Contactable by email
        </small>
      </div>

    </div>
  );
}


export default CustomersSummary;