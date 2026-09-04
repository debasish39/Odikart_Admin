import {
  X,
  LayoutDashboard,
  Users,
  Store,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Truck,
  Settings,
  ChevronRight,
  ChevronDown,
  TicketPercent,
  IndianRupee,
  ReceiptText,
  ArrowDownToLine,
  Percent,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";

const MobileSidebar = ({ open, onClose }) => {
  const location = useLocation();

  const [financeOpen, setFinanceOpen] = useState(
    location.pathname.startsWith("/admin/finance")
  );

  const menu = [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },

    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },

    {
      label: "Pending Sellers",
      path: "/admin/sellers/pending",
      icon: Store,
      badge: "New",
    },

    {
      label: "Approved Sellers",
      path: "/admin/sellers/approved",
      icon: Store,
    },

    {
      label: "Products",
      path: "/admin/products",
      icon: Package,
    },

    {
      label: "Categories",
      path: "/admin/categories",
      icon: FolderTree,
    },

    {
      label: "Couriers",
      path: "/admin/couriers",
      icon: Truck,
    },

    {
      label: "Orders",
      path: "/admin/orders",
      icon: ShoppingCart,
    },

    {
      label: "Coupons",
      path: "/admin/coupons",
      icon: TicketPercent,
    },

    {
      label: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },

    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },

    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  const financeMenu = [
    {
      label: "Overview",
      path: "/admin/finance",
      icon: IndianRupee,
      end: true,
    },
    {
      label: "Seller Wallets",
      path: "/admin/finance/wallets",
      icon: CreditCard,
    },
    {
      label: "Transactions",
      path: "/admin/finance/transactions",
      icon: ReceiptText,
    },
    {
      label: "Withdrawals",
      path: "/admin/finance/withdrawals",
      icon: ArrowDownToLine,
    },
    {
      label: "Commission",
      path: "/admin/finance/commission",
      icon: Percent,
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-black/30 backdrop-blur-[2px]
          transition-all duration-300
          lg:hidden
          ${
            open
              ? "visible opacity-100"
              : "invisible opacity-0"
          }
        `}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          flex h-screen w-[300px] flex-col
          overflow-hidden
          bg-white
          text-black
          border-r border-gray-200
          shadow-xl shadow-black/10
          transition-transform duration-300 ease-out
          lg:hidden
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-lg font-black text-white shadow-sm">
              O

              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Brand */}
            <div>
              <h1 className="text-base font-bold tracking-tight text-black">
                ODikart
              </h1>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin Panel
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              border border-gray-200
              text-gray-600
              transition-all duration-200
              hover:bg-gray-100
              hover:text-black
              active:scale-95
            "
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* Section title */}
          <div className="mb-3 px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Main Menu
            </p>
          </div>

          <div className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => `
                    group relative flex min-h-[50px]
                    items-center gap-3
                    rounded-xl px-3
                    text-sm font-semibold
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-gray-100 text-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 h-6 w-1 rounded-r-full bg-black" />
                      )}

                      {/* Icon */}
                      <span
                        className={`
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-lg
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-black text-white"
                              : "bg-gray-100 text-black group-hover:bg-gray-200"
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          strokeWidth={2.2}
                        />
                      </span>

                      {/* Label */}
                      <span className="min-w-0 flex-1 truncate text-black">
                        {item.label}
                      </span>

                      {/* New Badge */}
                      {item.badge && (
                        <span
                          className="
                            shrink-0
                            rounded-full
                            bg-emerald-50
                            px-2 py-1
                            text-[9px]
                            font-bold
                            leading-none
                            text-emerald-600
                            border border-emerald-100
                          "
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Arrow */}
                      <ChevronRight
                        size={15}
                        strokeWidth={2}
                        className={`
                          shrink-0
                          transition-all duration-200
                          ${
                            isActive
                              ? "translate-x-0 opacity-100 text-black"
                              : "-translate-x-1 text-gray-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          }
                        `}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* ================= FINANCE ================= */}
            <div className="pt-1">
              {/* Finance Header */}
              <button
                type="button"
                onClick={() => setFinanceOpen((prev) => !prev)}
                className={`
                  group relative flex min-h-[50px] w-full
                  items-center gap-3
                  rounded-xl px-3
                  text-sm font-semibold
                  transition-all duration-200
                  ${
                    location.pathname.startsWith("/admin/finance")
                      ? "bg-gray-100 text-black"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }
                `}
              >
                {/* Active indicator */}
                {location.pathname.startsWith("/admin/finance") && (
                  <span className="absolute left-0 h-6 w-1 rounded-r-full bg-black" />
                )}

                {/* Icon */}
                <span
                  className={`
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    transition-all duration-200
                    ${
                      location.pathname.startsWith("/admin/finance")
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black group-hover:bg-gray-200"
                    }
                  `}
                >
                  <IndianRupee
                    size={18}
                    strokeWidth={2.2}
                  />
                </span>

                {/* Label */}
                <span className="min-w-0 flex-1 text-left text-black">
                  Finance
                </span>

                {/* Chevron */}
                <ChevronDown
                  size={17}
                  strokeWidth={2}
                  className={`
                    shrink-0
                    text-gray-500
                    transition-transform duration-200
                    ${
                      financeOpen
                        ? "rotate-180"
                        : "rotate-0"
                    }
                  `}
                />
              </button>

              {/* Finance Submenu */}
              <div
                className={`
                  overflow-hidden
                  transition-all duration-300
                  ${
                    financeOpen
                      ? "max-h-[400px] opacity-100"
                      : "max-h-0 opacity-0"
                  }
                `}
              >
                <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3">
                  {financeMenu.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) => `
                          group relative flex min-h-[44px]
                          items-center gap-3
                          rounded-lg px-3
                          text-sm font-medium
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-black text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-black"
                          }
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={16}
                              strokeWidth={2.1}
                              className="shrink-0"
                            />

                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>

                            <ChevronRight
                              size={13}
                              strokeWidth={2}
                              className={`
                                shrink-0
                                transition-all duration-200
                                ${
                                  isActive
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                }
                              `}
                            />
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 p-4">
          {/* System Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              </div>

              {/* Status Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-black">
                  System Online
                </p>

                <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500">
                  All services operational
                </p>
              </div>
            </div>
          </div>

          {/* Version */}
          <p className="mt-3 text-center text-[10px] font-medium text-gray-400">
            ODikart Admin • v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;