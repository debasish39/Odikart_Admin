import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard
  from "../pages/dashboard/Dashboard";
import AdminLogin
  from "../pages/auth/AdminLogin";

import AdminRoute
  from "./AdminRoute";




const Unauthorized = () => {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <div className="text-center">

        <h1 className="text-4xl font-bold">
          403
        </h1>

        <p>
          Unauthorized
        </p>

      </div>

    </div>

  );

};


const AppRoutes = () => {

  return (

    <BrowserRouter>

      <Routes>

        {/* ADMIN LOGIN */}

        <Route
          path="/admin/login"
          element={
            <AdminLogin />
          }
        />


        {/* ADMIN DASHBOARD */}

        <Route
          path="/admin/dashboard"
          element={

            <AdminRoute>

              <Dashboard />

            </AdminRoute>

          }
        />


        {/* UNAUTHORIZED */}

        <Route
          path="/unauthorized"
          element={
            <Unauthorized />
          }
        />


        {/* DEFAULT */}

        <Route
          path="*"
          element={
            <Navigate
              to="/admin/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

};


export default AppRoutes;