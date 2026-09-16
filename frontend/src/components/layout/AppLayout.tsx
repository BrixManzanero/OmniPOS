import {
  NavLink,
  Outlet,
} from "react-router-dom";


function AppLayout() {
  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            O
          </div>

          <div>
            <strong>OmniPOS</strong>
            <span>Zero</span>
          </div>

        </div>


        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Dashboard
          </NavLink>


          <NavLink
            to="/pos"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Point of Sale
          </NavLink>


          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Products
          </NavLink>


          <NavLink
            to="/orders"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Orders
          </NavLink>


          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Inventory
          </NavLink>


          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Customers
          </NavLink>


          <NavLink
            to="/promotions"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Promotions
          </NavLink>


          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Analytics
          </NavLink>


          <NavLink
            to="/insights"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            AI Insights
          </NavLink>

        </nav>


        <div className="sidebar-footer">
          <span>OmniPOS Zero</span>
          <small>Development v0.5</small>
        </div>

      </aside>


      <div className="app-main">

        <header className="topbar">

          <div>
            <strong>Demo Restaurant</strong>
            <span>Main Branch</span>
          </div>


          <NavLink
            to="/store"
            className="store-link"
          >
            View Online Store
          </NavLink>

        </header>


        <main className="content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}


export default AppLayout;
