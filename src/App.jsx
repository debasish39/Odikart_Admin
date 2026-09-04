import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";

import AdminLogin from "./pages/auth/AdminLogin";

import Dashboard from "./pages/dashboard/Dashboard";
import PendingSellers from "./pages/dashboard/PendingSellers";
import ApprovedSellers from "./pages/dashboard/ApprovedSellers";
import RejectedSellers from "./pages/dashboard/RejectedSellers";
import Products from "./pages/dashboard/Products";
import SellerDetails from "./pages/dashboard/SellerDetails";
import Users from "./pages/dashboard/Users";
import Orders from "./pages/dashboard/Orders";
import Couriers from "./pages/couriers/Couriers";
import Coupons from "./pages/dashboard/Coupons";
import Categories from "./pages/dashboard/Categories";
// import Finance from "./pages/finance/Finance";
// import Wallets from "./pages/finance/Wallets";
// import Transactions from "./pages/finance/Transactions";
// import Withdrawals from "./pages/finance/Withdrawals";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            ADMIN LOGIN
        ========================= */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
        {/* =========================
            PROTECTED ADMIN ROUTES
        ========================= */}
      <Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  <Route path="products" element={<Products />} />
  <Route path="orders" element={<Orders />} />
  <Route path="couriers" element={<Couriers />} />
  <Route path="users" element={<Users />} />

  <Route path="categories" element={<Categories />} />
  <Route path="coupons" element={<Coupons />} />

  <Route path="sellers/pending" element={<PendingSellers />} />
  <Route path="sellers/approved" element={<ApprovedSellers />} />
  <Route path="sellers/rejected" element={<RejectedSellers />} />
  <Route path="sellers/:id" element={<SellerDetails />} />
  {/* <Route path="finance" element={<Finance />} />
<Route path="finance/wallets" element={<Wallets />} />
<Route path="finance/transactions" element={<Transactions />} />
<Route path="finance/withdrawals" element={<Withdrawals />} /> */}
</Route>
        {/* =========================
            DEFAULT
        ========================= */}
        <Route
          path="*"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;