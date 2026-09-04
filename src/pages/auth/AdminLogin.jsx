import { useState } from "react";
import { Navigate } from "react-router-dom";

import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";

import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminLogin = () => {

  const {
    login,
    user,
    loading,
  } = useAdminAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  if (!loading && user?.role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {

      setSubmitting(true);

      await login(
        email.trim(),
        password
      );

      window.location.href =
        "/admin";

    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to login"
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* LEFT */}

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          <div>

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white text-black flex items-center justify-center font-black text-xl">
                O
              </div>

              <div>

                <h1 className="text-white text-xl font-bold">
                  ODikart
                </h1>

                <p className="text-xs text-gray-500">
                  Administration
                </p>

              </div>

            </div>

          </div>

          <div>

            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-8">

              <ShieldCheck
                size={32}
                className="text-white"
              />

            </div>

            <h2 className="text-5xl font-bold text-white leading-tight max-w-xl">
              Manage your marketplace from one place.
            </h2>

            <p className="text-gray-400 mt-6 text-lg max-w-lg">
              Control sellers, customers,
              products, orders and the
              entire ODikart ecosystem.
            </p>

          </div>

          <p className="text-gray-600 text-sm">
            ODikart Admin • Secure access
          </p>

        </div>

      </div>

      {/* RIGHT */}

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Mobile logo */}

          <div className="lg:hidden text-center mb-10">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl">
              O
            </div>

            <h1 className="text-white text-2xl font-bold mt-4">
              ODikart Admin
            </h1>

          </div>

          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl">

            <div className="mb-8">

              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back
              </h2>

              <p className="text-gray-500 mt-2">
                Sign in to your admin dashboard.
              </p>

            </div>

            {error && (

              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>

            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="admin@odikart.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* Button */}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {submitting ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />

                    Signing in...
                  </>
                ) : (
                  "Sign in to Admin"
                )}

              </button>

            </form>

            <div className="mt-7 pt-6 border-t text-center">

              <p className="text-xs text-gray-400">
                This area is restricted to
                authorized administrators.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLogin;