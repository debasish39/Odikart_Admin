import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock3,
  IndianRupee,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import adminApi from "../../services/adminApi";
import { getAdminOrders } from "../../services/orderApi";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const displayId = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value.$oid) return String(value.$oid);
  if (value._id) return displayId(value._id);
  return "";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const customerName = (order) => {
  const user = order?.userId;

  if (order?.fullname || order?.fullName) {
    return String(order.fullname || order.fullName);
  }

  if (user && typeof user === "object") {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.fullName || user.name || user.email || "Customer";
  }

  return order?.email || "Customer";
};

const orderTotal = (order) =>
  Number(
    order?.pricing?.total ??
      order?.totalAmount ??
      order?.total ??
      0
  );

const statusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("delivered") ||
    value.includes("completed") ||
    value.includes("approved")
  ) {
    return "bg-black text-white border-black";
  }

  if (value.includes("cancel") || value.includes("reject")) {
    return "bg-white text-black border-neutral-300";
  }

  if (value.includes("return") || value.includes("refund")) {
    return "bg-neutral-200 text-black border-neutral-300";
  }

  return "bg-neutral-100 text-black border-neutral-200";
};

function StatCard({ label, value, icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>

        <div className="shrink-0 h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, total }) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-black transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [products, setProducts] = useState([]);
  const [couriers, setCouriers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const results = await Promise.allSettled([
        getAdminOrders(),
        adminApi.get("/users"),
        adminApi.get("/admin/sellers/approved"),
        adminApi.get("/admin/sellers/pending"),
        adminApi.get("/admin/sellers/rejected"),
        adminApi.get("/products/admin/all"),
        adminApi.get("/couriers"),
      ]);

      const [
        ordersResult,
        usersResult,
        approvedSellersResult,
        pendingSellersResult,
        rejectedSellersResult,
        productsResult,
        couriersResult,
      ] = results;

      if (ordersResult.status === "fulfilled") {
        const data = ordersResult.value;
        if (data?.success) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      }

      if (usersResult.status === "fulfilled") {
        const data = usersResult.value?.data;

        // userController.getUsers() returns totalUsers.
        setTotalUsers(Number(data?.totalUsers || 0));

        // The endpoint is paginated, so use the returned page only
        // to identify role distribution when available.
        const list = Array.isArray(data?.users) ? data.users : [];

        const pageCustomers = list.filter(
          (user) => user?.role === "user"
        ).length;

        const pageAdmins = list.filter(
          (user) => user?.role === "admin"
        ).length;

        // These are replaced by seller-specific totals below.
        if (data?.totalUsers === 0) {
          setTotalCustomers(0);
          setTotalAdmins(0);
        } else {
          setTotalCustomers(pageCustomers);
          setTotalAdmins(pageAdmins);
        }
      }

      const approvedSellers =
        approvedSellersResult.status === "fulfilled"
          ? approvedSellersResult.value?.data?.sellers || []
          : [];

      const pendingSellers =
        pendingSellersResult.status === "fulfilled"
          ? pendingSellersResult.value?.data?.sellers || []
          : [];

      const rejectedSellers =
        rejectedSellersResult.status === "fulfilled"
          ? rejectedSellersResult.value?.data?.sellers || []
          : [];

      setTotalSellers(
        approvedSellers.length +
          pendingSellers.length +
          rejectedSellers.length
      );

      if (productsResult.status === "fulfilled") {
        const data = productsResult.value?.data;
        const list =
          data?.products ||
          data?.data ||
          data?.results ||
          [];
        if (Array.isArray(list)) setProducts(list);
      }

      if (couriersResult.status === "fulfilled") {
        const data = couriersResult.value?.data;
        const list = data?.couriers || data?.data || data?.results || [];
        if (Array.isArray(list)) setCouriers(list);
      }

      if (ordersResult.status === "rejected") {
        throw ordersResult.reason;
      }

      if (silent) toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const pending = orders.filter(
      (order) =>
        order?.status === "Pending Payment" ||
        order?.status === "Confirmed"
    ).length;

    const processing = orders.filter((order) =>
      [
        "Processing",
        "Packed",
        "Ready for Pickup",
        "Shipped",
        "In Transit",
        "Out for Delivery",
      ].includes(order?.status)
    ).length;

    const delivered = orders.filter(
      (order) => order?.status === "Delivered"
    ).length;

    const returns = orders.filter((order) => {
      const status = String(order?.status || "").toLowerCase();
      return status.includes("return") || status.includes("refund");
    }).length;

    const cancelled = orders.filter(
      (order) => order?.status === "Cancelled"
    ).length;

    const revenue = orders.reduce((sum, order) => {
      if (["Cancelled", "Refund Completed"].includes(order?.status)) {
        return sum;
      }
      return sum + orderTotal(order);
    }, 0);

    const activeCouriers = couriers.filter(
      (courier) =>
        courier?.isActive === true &&
        courier?.verificationStatus === "verified" &&
        courier?.status !== "suspended"
    ).length;

    return {
      totalOrders,
      pending,
      processing,
      delivered,
      returns,
      cancelled,
      revenue,
      users: totalUsers,
      customers: totalCustomers,
      sellers: totalSellers,
      admins: totalAdmins,
      products: products.length,
      couriers: activeCouriers,
    };
  }, [
    orders,
    totalUsers,
    totalCustomers,
    totalSellers,
    totalAdmins,
    products,
    couriers,
  ]);

  const statusData = useMemo(
    () => [
      { label: "Pending", value: stats.pending },
      { label: "Processing", value: stats.processing },
      { label: "Delivered", value: stats.delivered },
      { label: "Returns", value: stats.returns },
      { label: "Cancelled", value: stats.cancelled },
    ],
    [stats]
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        )
        .slice(0, 7),
    [orders]
  );

  const todayOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const date = new Date(order?.createdAt);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toDateString() === now.toDateString()
      );
    });
  }, [orders]);

  const todayRevenue = useMemo(
    () =>
      todayOrders.reduce((sum, order) => {
        if (order?.status === "Cancelled") return sum;
        return sum + orderTotal(order);
      }, 0),
    [todayOrders]
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 rounded-full border-4 border-neutral-200 border-t-black animate-spin" />
          <p className="text-sm font-medium text-neutral-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={24} />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Dashboard
                </h1>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Overview of your Odikart marketplace.
              </p>
            </div>

            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Primary stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Orders"
            value={stats.totalOrders}
            subtitle={`${todayOrders.length} today`}
            icon={<ShoppingBag size={19} />}
          />

          <StatCard
            label="Revenue"
            value={money(stats.revenue)}
            subtitle={`${money(todayRevenue)} today`}
            icon={<IndianRupee size={19} />}
          />

          <StatCard
            label="Total Users"
            value={stats.users}
            subtitle={`${stats.customers} customers` }
            icon={<Users size={19} />}
          />

          <StatCard
            label="Sellers"
            value={stats.sellers}
            subtitle="Approved + pending + rejected"
            icon={<Store size={19} />}
          />
        </section>

        {/* Account breakdown */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Account Overview</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Current registered account distribution.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AccountPill label="Customers" value={stats.customers} />
              <AccountPill label="Sellers" value={stats.sellers} />
              <AccountPill label="Admins" value={stats.admins} />
            </div>
          </div>
        </section>

        {/* Operations stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Products"
            value={stats.products}
            subtitle="Catalog products"
            icon={<Box size={19} />}
          />

          <StatCard
            label="Active Couriers"
            value={stats.couriers}
            subtitle="Verified & active"
            icon={<Truck size={19} />}
          />

          <StatCard
            label="Processing"
            value={stats.processing}
            subtitle="Orders in fulfillment"
            icon={<Clock3 size={19} />}
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            subtitle="Successfully delivered"
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Overview */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">Order Overview</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Current order distribution.
                </p>
              </div>

              <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Package size={19} />
              </div>
            </div>

            <div className="space-y-5">
              {statusData.map((item) => (
                <MiniBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  total={stats.totalOrders}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">Marketplace Health</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Quick operational snapshot.
                </p>
              </div>

              <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Activity size={19} />
              </div>
            </div>

            <div className="space-y-3">
              <HealthRow
                icon={<UserRound size={17} />}
                label="Customers"
                value={stats.customers}
              />
              <HealthRow
                icon={<Store size={17} />}
                label="Sellers"
                value={stats.sellers}
              />
              <HealthRow
                icon={<Box size={17} />}
                label="Products"
                value={stats.products}
              />
              <HealthRow
                icon={<Truck size={17} />}
                label="Couriers"
                value={stats.couriers}
              />
              <HealthRow
                icon={<RotateCcw size={17} />}
                label="Returns"
                value={stats.returns}
              />
              <HealthRow
                icon={<XCircle size={17} />}
                label="Cancelled"
                value={stats.cancelled}
              />
            </div>
          </div>
        </section>

        {/* Recent orders */}
        <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-5 sm:px-6 py-5 border-b border-neutral-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Latest activity across the marketplace.
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center">
              <ShoppingBag size={17} />
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto text-neutral-300" />
              <p className="mt-3 font-semibold">No orders yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                New orders will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold">
                        Order
                      </th>
                      <th className="text-left px-6 py-4 font-semibold">
                        Customer
                      </th>
                      <th className="text-left px-6 py-4 font-semibold">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 font-semibold">
                        Total
                      </th>
                      <th className="text-left px-6 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={displayId(order?._id)}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold">
                            #{order?.orderNumber || displayId(order?._id).slice(-8)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold">
                            {customerName(order)}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {order?.email || order?.userId?.email || "—"}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-neutral-600">
                          {formatDate(order?.createdAt)}
                        </td>

                        <td className="px-6 py-4 font-bold">
                          {money(orderTotal(order))}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${statusClass(
                              order?.status
                            )}`}
                          >
                            {order?.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-neutral-100">
                {recentOrders.map((order) => (
                  <div
                    key={displayId(order?._id)}
                    className="p-4 flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <Package size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold truncate">
                          #{order?.orderNumber || displayId(order?._id).slice(-8)}
                        </p>

                        <span
                          className={`shrink-0 inline-flex px-2 py-1 rounded-full border text-[10px] font-semibold ${statusClass(
                            order?.status
                          )}`}
                        >
                          {order?.status || "Unknown"}
                        </span>
                      </div>

                      <p className="text-sm font-medium truncate mt-1">
                        {customerName(order)}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-neutral-500">
                          {formatDateTime(order?.createdAt)}
                        </p>
                        <p className="text-sm font-bold">
                          {money(orderTotal(order))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Bottom cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickCard
            icon={<Wallet size={20} />}
            title="Revenue"
            value={money(stats.revenue)}
            description="Marketplace order value"
            trend={<ArrowUpRight size={17} />}
          />

          <QuickCard
            icon={<Truck size={20} />}
            title="Fulfillment"
            value={`${stats.processing}`}
            description="Orders currently moving"
            trend={<ArrowUpRight size={17} />}
          />

          <QuickCard
            icon={<RotateCcw size={20} />}
            title="Returns"
            value={`${stats.returns}`}
            description="Return or refund cases"
            trend={<ArrowDownRight size={17} />}
          />
        </section>
      </main>
    </div>
  );
}

function AccountPill({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
      <p className="text-[11px] font-medium text-neutral-500">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </div>
  );
}

function HealthRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>

      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function QuickCard({ icon, title, value, description, trend }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          {icon}
        </div>
        <span className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center">
          {trend}
        </span>
      </div>

      <p className="text-sm text-neutral-500 mt-5">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{description}</p>
    </div>
  );
}
