
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Bell, Search, CheckCheck, ArrowUpRight, ShoppingCart,
  Package, Info, Tag, Truck, UserRound, X, LoaderCircle,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../../services/notificationApi";

const getRows = (data) =>
  Array.isArray(data) ? data : data?.notifications || data?.items || data?.results || [];

const getUnread = (data, rows) => {
  const raw = data?.unreadCount ?? data?.unread ?? data?.countUnread;
  return Number.isFinite(Number(raw)) ? Number(raw) : rows.filter((n) => !n.isRead).length;
};

const notificationIcon = (type = "system") => {
  if (["order", "order_update"].includes(type)) return ShoppingCart;
  if (["new_product", "back_in_stock"].includes(type)) return Package;
  if (["delivery"].includes(type)) return Truck;
  if (["promotion", "offer", "coupon", "flash_sale", "price_drop"].includes(type)) return Tag;
  if (["account"].includes(type)) return UserRound;
  return Info;
};

const timeAgo = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const Topbar = ({ onMenuClick }) => {
  const { user } = useAdminAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin";

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminNotifications(8);
      const rows = getRows(data);
      setNotifications(rows);
      setUnreadCount(getUnread(data, rows));
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(timer);
    // Load once on mount and refresh periodically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      setBusyId(String(item._id));
      try {
        await markAdminNotificationRead(item._id);
        setNotifications((current) => current.map((n) => String(n._id) === String(item._id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        setError(err?.response?.data?.message || "Could not mark notification as read.");
      } finally {
        setBusyId("");
      }
    }
    setOpen(false);
    if (item.link && item.link.startsWith("/admin")) navigate(item.link);
    else if (item.orderId) navigate(`/admin/orders`);
    else if (item.productId) navigate(`/admin/products`);
    else navigate("/admin/notifications");
  };

  const handleMarkAll = async () => {
    if (!unreadCount) return;
    setBusyId("all");
    try {
      await markAllAdminNotificationsRead();
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not mark all as read.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden">
          <Menu size={21} />
        </button>
        <div className="hidden w-64 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-slate-400 focus-within:bg-white md:flex xl:w-80">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input type="search" placeholder="Search your workspace..." aria-label="Search workspace" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 xl:inline">⌘ K</kbd>
        </div>
        <p className="truncate text-sm font-semibold text-slate-800 md:hidden">Admin workspace</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div ref={wrapperRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/admin/notifications");
            }}
            aria-label={`Open notifications page${unreadCount ? `, ${unreadCount} unread` : ""}`}
            title="Open notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-slate-600 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <Bell size={20} strokeWidth={1.9} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,410px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-18px_rgba(15,23,42,0.3)] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div><div className="flex items-center gap-2"><h2 className="text-base font-bold text-slate-900">Notifications</h2>{unreadCount > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">{unreadCount} new</span>}</div><p className="mt-1 text-xs text-slate-500">Updates from your Odikart store</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button>
            </div>
            {unreadCount > 0 && <div className="flex justify-end border-b border-slate-100 px-4 py-2"><button type="button" disabled={busyId === "all"} onClick={handleMarkAll} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-50"><CheckCheck size={14} />{busyId === "all" ? "Updating..." : "Mark all as read"}</button></div>}
            {error && <p role="alert" className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            <div className="max-h-[390px] overflow-y-auto">
              {loading && notifications.length === 0 ? <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" />Loading notifications...</div> : notifications.length === 0 ? <div className="px-6 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Bell size={21} /></div><p className="mt-3 text-sm font-semibold text-slate-800">You're all caught up</p><p className="mt-1 text-xs text-slate-500">New order and store updates will appear here.</p></div> : notifications.map((item) => {
                const Icon = notificationIcon(item.type);
                return <button type="button" key={item._id} onClick={() => handleNotificationClick(item)} disabled={busyId === String(item._id)} className={`group flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5 ${!item.isRead ? "bg-blue-50/40" : "bg-white"}`}>
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${!item.isRead ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className={`line-clamp-1 text-sm ${!item.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>{item.title || "Notification"}</span>{!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{item.message}</span><span className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">{timeAgo(item.createdAt)}{busyId === String(item._id) && <LoaderCircle size={11} className="animate-spin" />}</span></span>
                </button>;
              })}
            </div>
            <button type="button" onClick={() => { setOpen(false); navigate("/admin/notifications"); }} className="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">View all notifications <ArrowUpRight size={16} /></button>
          </div>}
        </div>

        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm shadow-slate-900/15">{name.charAt(0).toUpperCase()}</div>
          <div className="hidden sm:block"><p className="max-w-40 truncate text-sm font-bold text-slate-900">{name}</p><p className="mt-0.5 text-[11px] font-medium text-slate-500">Administrator</p></div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
