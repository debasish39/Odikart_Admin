import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../context/AdminAuthContext";

const AdminRoute = () => {
  const {
    user,
    loading,
    isAdmin,
  } = useAdminAuth();

  const location =
    useLocation();

  // Checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />

          <p className="text-white mt-4 text-sm">
            Checking admin access...
          </p>

        </div>

      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;