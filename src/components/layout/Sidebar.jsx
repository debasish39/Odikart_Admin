import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
  FolderTree,
  Tags,
  TicketPercent,
  Truck,
  Wallet,
  Settings,
  ChevronDown,
  IndianRupee,
  ReceiptText,
  ArrowDownToLine,
  Percent,
} from "lucide-react";
import { useState } from "react";

const mainMenuItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
];

const managementItems = [
  {
    name: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    name: "Sellers",
    path: "/admin/sellers/pending",
    icon: Store,
  },
  {
    name: "Customers",
    path: "/admin/users",
    icon: Users,
  },
  {
    name: "Couriers",
    path: "/admin/couriers",
    icon: Truck,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
  },
  {
    name: "Brands",
    path: "/admin/brands",
    icon: Tags,
  },
];

const growthItems = [
  {
    name: "Coupons",
    path: "/admin/coupons",
    icon: TicketPercent,
  },
];

const financeItems = [
  {
    name: "Overview",
    path: "/admin/finance",
    icon: IndianRupee,
    end: true,
  },
  {
    name: "Wallets",
    path: "/admin/finance/wallets",
    icon: Wallet,
  },
  {
    name: "Transactions",
    path: "/admin/finance/transactions",
    icon: ReceiptText,
  },
  {
    name: "Withdrawals",
    path: "/admin/finance/withdrawals",
    icon: ArrowDownToLine,
  },
  {
    name: "Commission",
    path: "/admin/finance/commission",
    icon: Percent,
  },
];

const bottomItems = [
  {
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

const Sidebar = () => {
  const [financeOpen, setFinanceOpen] = useState(true);

  const renderNavItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.name}
        to={item.path}
        end={item.end}
        className={({ isActive }) => `
          group flex items-center gap-3 rounded-xl px-4 py-3
          text-[15px] font-medium transition-all duration-200
          ${
            isActive
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }
        `}
      >
        {({ isActive }) => (
          <>
            <Icon
              size={19}
              strokeWidth={isActive ? 2.2 : 2}
              className="shrink-0"
            />

            <span className="truncate">{item.name}</span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">

        {/* =========================
            LOGO
        ========================== */}
        <div className="flex h-[125px] items-center border-b border-slate-100 px-7">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight text-slate-950">
              OdiKart
            </h1>

            <p className="mt-1 text-[18px] text-slate-500">
              Admin Panel
            </p>
          </div>
        </div>

        {/* =========================
            NAVIGATION
        ========================== */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">

          {/* MAIN */}
          <div>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Main
            </p>

            <div className="space-y-1">
              {mainMenuItems.map(renderNavItem)}
            </div>
          </div>

          {/* MANAGEMENT */}
          <div className="mt-7">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Management
            </p>

            <div className="space-y-1">
              {managementItems.map(renderNavItem)}
            </div>
          </div>

          {/* FINANCE */}
          <div className="mt-7">
            <button
              type="button"
              onClick={() => setFinanceOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Wallet size={19} strokeWidth={2} />

                <span>Finance</span>
              </div>

              <ChevronDown
                size={17}
                className={`transition-transform duration-200 ${
                  financeOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            {financeOpen && (
              <div className="mt-1 space-y-1 border-l border-slate-200 ml-6 pl-2">
                {financeItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) => `
                        group flex items-center gap-3 rounded-lg px-3 py-2.5
                        text-sm font-medium transition-all
                        ${
                          isActive
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            strokeWidth={isActive ? 2.2 : 2}
                            className="shrink-0"
                          />

                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* GROWTH */}
          <div className="mt-7">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Growth
            </p>

            <div className="space-y-1">
              {growthItems.map(renderNavItem)}
            </div>
          </div>

          {/* CONTROL */}
          <div className="mt-7">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Control
            </p>

            <div className="space-y-1">
              {bottomItems.map(renderNavItem)}
            </div>
          </div>
        </nav>

        {/* =========================
            BOTTOM ADMIN CARD
        ========================== */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-600">
              OdiKart Admin
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Management Panel
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;