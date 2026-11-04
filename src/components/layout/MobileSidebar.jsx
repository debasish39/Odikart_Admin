import { useEffect, useState } from "react";
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
  Images,
  Sparkles,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const mainMenu = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Users", path: "/admin/users", icon: Users },
  {
    label: "Pending Sellers",
    path: "/admin/sellers/pending",
    icon: Store,
    badge: "New",
  },
  { label: "Approved Sellers", path: "/admin/sellers/approved", icon: Store },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Categories", path: "/admin/categories", icon: FolderTree },
  { label: "Couriers", path: "/admin/couriers", icon: Truck },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Coupons", path: "/admin/coupons", icon: TicketPercent },
  { label: "Banners", path: "/admin/banners", icon: Images, badge: "Marketing" },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const financeMenu = [
  { label: "Overview", path: "/admin/finance", icon: IndianRupee, end: true },
  { label: "Seller Wallets", path: "/admin/finance/wallets", icon: CreditCard },
  { label: "Transactions", path: "/admin/finance/transactions", icon: ReceiptText },
  { label: "Withdrawals", path: "/admin/finance/withdrawals", icon: ArrowDownToLine },
  { label: "Commission", path: "/admin/finance/commission", icon: Percent },
];

const MobileSidebar = ({ open, onClose }) => {
  const location = useLocation();
  const isFinanceRoute = location.pathname.startsWith("/admin/finance");
  const [financeOpen, setFinanceOpen] = useState(isFinanceRoute);

  useEffect(() => {
    if (isFinanceRoute) setFinanceOpen(true);
  }, [isFinanceRoute]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const navClass = ({ isActive }) =>
    [
      "group relative flex min-h-[46px] items-center gap-3 rounded-xl px-3",
      "text-[13px] font-medium transition-all duration-200",
      isActive
        ? "bg-slate-900 text-white shadow-sm shadow-slate-900/10"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        onClick={onClose}
        className={navClass}
      >
        {({ isActive }) => (
          <>
            <span
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900",
              ].join(" ")}
            >
              <Icon size={17} strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {item.badge && (
              <span
                className={[
                  "rounded-full px-2 py-1 text-[9px] font-bold leading-none",
                  isActive
                    ? "bg-white/15 text-white"
                    : item.badge === "New"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-violet-50 text-violet-700",
                ].join(" ")}
              >
                {item.badge}
              </span>
            )}

            <ChevronRight
              size={15}
              className={[
                "shrink-0 transition-all",
                isActive
                  ? "translate-x-0 text-white/80"
                  : "-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
              ].join(" ")}
            />
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={[
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[3px]",
          "transition-opacity duration-300 lg:hidden",
          open ? "visible opacity-100" : "invisible pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Drawer */}
      <aside
        aria-label="Mobile admin navigation"
        aria-hidden={!open}
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min( min(88vw,340px),340px)]",
          "flex-col overflow-hidden border-r border-slate-200 bg-white",
          "shadow-2xl shadow-slate-950/15 transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-5 pb-5 pt-6">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-100/70 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-900/15">
                O
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <p className="text-[17px] font-extrabold tracking-tight text-slate-950">
                  Odi<span className="text-blue-600">kart</span>
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Admin workspace
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5">
            <Sparkles size={15} className="shrink-0 text-blue-600" />
            <p className="text-[11px] font-medium text-blue-900">
              Manage your store in one place
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          <div className="mb-3 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
            <span className="text-[10px] font-medium text-slate-300">
              {mainMenu.length} sections
            </span>
          </div>

          <div className="space-y-1">
            {mainMenu.map(renderMenuItem)}
          </div>

          {/* Finance group */}
          <div className="mt-6">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Business
            </p>

            <button
              type="button"
              aria-expanded={financeOpen}
              onClick={() => setFinanceOpen((previous) => !previous)}
              className={[
                "group flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3",
                "text-[13px] font-semibold transition-colors",
                isFinanceRoute
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isFinanceRoute
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900",
                ].join(" ")}
              >
                <IndianRupee size={17} strokeWidth={2} />
              </span>
              <span className="flex-1 text-left">Finance</span>
              <ChevronDown
                size={17}
                className={[
                  "transition-transform duration-200",
                  financeOpen ? "rotate-180" : "",
                  isFinanceRoute ? "text-white/80" : "text-slate-400",
                ].join(" ")}
              />
            </button>

            <div
              className={[
                "grid transition-all duration-300 ease-in-out",
                financeOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="ml-7 mt-2 space-y-1 border-l border-slate-200 pl-3">
                  {financeMenu.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            "group flex min-h-[40px] items-center gap-2.5 rounded-lg px-3",
                            "text-xs font-medium transition-colors",
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                          ].join(" ")
                        }
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <ChevronRight
                          size={13}
                          className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800">System status</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  All services operational
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                ONLINE
              </span>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
            OdiKart Admin <span className="px-1">·</span> v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
