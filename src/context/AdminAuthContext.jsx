import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import adminApi from "../services/adminApi";

import {
  getAdminToken,
  getAdminUser,
  saveAdminAuth,
  clearAdminAuth,
} from "../utils/storage";

const AdminAuthContext =
  createContext(null);

export const AdminAuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(getAdminUser());

  const [token, setToken] =
    useState(getAdminToken());

  const [loading, setLoading] =
    useState(true);

  // =========================
  // ADMIN LOGIN
  // =========================
  const login = async (
    email,
    password
  ) => {
    try {
      const response =
        await adminApi.post(
          "/auth/admin-login",
          {
            email,
            password,
          }
        );

      const {
        token: newToken,
        user: adminUser,
      } = response.data;

      if (
        !newToken ||
        !adminUser
      ) {
        throw new Error(
          "Invalid admin login response"
        );
      }

      // Make sure logged-in account is admin
      if (
        adminUser.role !== "admin"
      ) {
        throw new Error(
          "You are not authorized as admin"
        );
      }

      // Save authentication
      saveAdminAuth(
        newToken,
        adminUser
      );

      // Update state
      setToken(newToken);
      setUser(adminUser);

      return response.data;
    } catch (error) {
      console.error(
        "Admin login failed:",
        error
      );

      throw error;
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    clearAdminAuth();

    setToken(null);
    setUser(null);
  };

  // =========================
  // REFRESH ADMIN
  // =========================
  const refreshAdmin =
    async () => {
      try {
        const currentToken =
          getAdminToken();

        // No token
        if (!currentToken) {
          setLoading(false);
          return;
        }

        // Get current logged-in user
        const response =
          await adminApi.get(
            "/auth/me"
          );

        const adminUser =
          response.data.user;

        // Validate user
        if (
          !adminUser ||
          adminUser.role !== "admin"
        ) {
          throw new Error(
            "Invalid admin account"
          );
        }

        // Save latest user
        saveAdminAuth(
          currentToken,
          adminUser
        );

        setToken(currentToken);
        setUser(adminUser);
      } catch (error) {
        console.error(
          "Admin authentication failed:",
          error
        );

        clearAdminAuth();

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // CHECK LOGIN ON APP LOAD
  // =========================
  useEffect(() => {
    refreshAdmin();
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        loading,

        isAdmin:
          !!user &&
          user.role === "admin",

        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// =========================
// CUSTOM HOOK
// =========================
export const useAdminAuth =
  () => {
    const context =
      useContext(
        AdminAuthContext
      );

    if (!context) {
      throw new Error(
        "useAdminAuth must be used inside AdminAuthProvider"
      );
    }

    return context;
  };