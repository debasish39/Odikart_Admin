import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Tag, Percent, IndianRupee, CalendarDays,
  Pencil, Trash2, Power, X, Check, Loader2, Copy, RefreshCw,
  Ticket, TicketPercent,    
} from "lucide-react";
import {
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from "../../services/couponApi";
import { toast } from "react-hot-toast";

const emptyForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscount: "",
  expiryDate: "",
  isActive: true,
};

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const dateText = (v) => {
  if (!v) return "No expiry";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const statusOf = (c) => {
  if (c.expiryDate && new Date(c.expiryDate) <= new Date()) return "expired";
  return c.isActive ? "active" : "inactive";
};

const StatusBadge = ({ coupon }) => {
  const status = statusOf(coupon);
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    expired: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : status === "expired" ? "bg-red-500" : "bg-slate-400"}`} />
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
};

const Stat = ({ title, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
        <p className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:h-11 sm:w-11">
        <Icon size={19} />
      </div>
    </div>
  </div>
);

const CouponModal = ({ open, editing, form, setForm, onClose, onSubmit, saving }) => {
  if (!open) return null;

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{editing ? "Edit Coupon" : "Create Coupon"}</h2>
            <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">{editing ? "Update your promotional coupon" : "Create a new promotional coupon"}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">Coupon Code</label>
              <div className="relative">
                <TicketPercent size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="code" value={form.code} onChange={change} placeholder="WELCOME20" maxLength={50} required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold uppercase outline-none focus:border-slate-900 focus:bg-white" />
              </div>
            </div>

            <Field label="Discount Type">
              <select name="discountType" value={form.discountType} onChange={change}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white sm:px-4">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </Field>

            <Field label="Discount Value">
              <div className="relative">
                {form.discountType === "PERCENTAGE" ? <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> : <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                <input type="number" name="discountValue" value={form.discountValue} onChange={change} min="0.01" step="0.01" required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:bg-white sm:pl-10 sm:pr-4" />
              </div>
            </Field>

            <Field label="Minimum Order">
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={change} min="0" step="0.01" placeholder="1000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:bg-white sm:pl-10 sm:pr-4" />
              </div>
            </Field>

            <Field label="Maximum Discount">
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" name="maxDiscount" value={form.maxDiscount} onChange={change} min="0" step="0.01" placeholder="500"
                  disabled={form.discountType === "FIXED"}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:bg-white disabled:opacity-50 sm:pl-10 sm:pr-4" />
              </div>
            </Field>

            <Field label="Expiry Date">
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="datetime-local" name="expiryDate" value={form.expiryDate} onChange={change} required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:bg-white sm:pl-10 sm:pr-4" />
              </div>
            </Field>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={change} className="h-4 w-4 accent-black" />
              <span className="text-sm font-semibold text-slate-700">Active Coupon</span>
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{form.code || "COUPONCODE"}</p>
                <p className="mt-1 text-xs text-slate-500">{form.discountType === "PERCENTAGE" ? `${form.discountValue || 0}% OFF` : `${money(form.discountValue)} OFF`}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-slate-400">Minimum order</p>
                <p className="text-sm font-bold text-slate-800">{money(form.minOrderAmount)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">{label}</label>
    {children}
  </div>
);

const DeleteModal = ({ coupon, onClose, onConfirm, deleting }) => {
  if (!coupon) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Trash2 size={20} /></div>
        <h2 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl">Delete coupon?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Permanently delete <strong className="text-slate-800">{coupon.code}</strong>? This action cannot be undone.</p>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={deleting} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {deleting && <Loader2 size={16} className="animate-spin" />} Delete Coupon
          </button>
        </div>
      </div>
    </div>
  );
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (initial = false) => {
    try {
      initial ? setLoading(true) : setRefreshing(true);
      const data = await getCoupons();
      setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(true); }, []);

  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter((c) => statusOf(c) === "active").length,
    inactive: coupons.filter((c) => statusOf(c) === "inactive").length,
    expired: coupons.filter((c) => statusOf(c) === "expired").length,
  }), [coupons]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return coupons.filter((c) => {
      const searchMatch = !q || c.code?.toUpperCase().includes(q);
      const filterMatch = filter === "ALL" || statusOf(c) === filter.toLowerCase();
      return searchMatch && filterMatch;
    });
  }, [coupons, search, filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModal(true);
  };

  const openEdit = (c) => {
    let expiry = "";
    if (c.expiryDate) {
      const d = new Date(c.expiryDate);
      if (!Number.isNaN(d.getTime())) {
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        expiry = local.toISOString().slice(0, 16);
      }
    }
    setEditing(c);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "PERCENTAGE",
      discountValue: c.discountValue ?? "",
      minOrderAmount: c.minOrderAmount ?? "",
      maxDiscount: c.maxDiscount ?? "",
      expiryDate: expiry,
      isActive: c.isActive !== false,
    });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.discountValue);
    const expiry = new Date(form.expiryDate);

    if (!/^[A-Z0-9_-]{3,50}$/.test(code)) return toast.error("Coupon code must contain 3-50 letters, numbers, _ or -");
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter a valid discount value");
    if (form.discountType === "PERCENTAGE" && value > 100) return toast.error("Percentage discount cannot exceed 100%");
    if (!form.expiryDate || Number.isNaN(expiry.getTime()) || expiry <= new Date()) return toast.error("Expiry date must be in the future");

    const payload = {
      code,
      discountType: form.discountType,
      discountValue: value,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount: form.discountType === "PERCENTAGE" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
      expiryDate: expiry.toISOString(),
      isActive: Boolean(form.isActive),
    };

    try {
      setSaving(true);
      const data = editing
        ? await updateCoupon(editing._id, payload)
        : await createCoupon(payload);
      toast.success(data?.message || (editing ? "Coupon updated successfully" : "Coupon created successfully"));
      setModal(false);
      setEditing(null);
      setForm({ ...emptyForm });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c) => {
    if (statusOf(c) === "expired") return;
    try {
      const next = !c.isActive;
      await updateCoupon(c._id, { isActive: next });
      setCoupons((prev) => prev.map((x) => x._id === c._id ? { ...x, isActive: next } : x));
      toast.success(next ? "Coupon activated" : "Coupon deactivated");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update coupon");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteCoupon(deleteTarget._id);
      setCoupons((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Coupon deleted");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied");
    } catch {
      toast.error("Unable to copy coupon code");
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center">
        <Loader2 size={30} className="mx-auto animate-spin text-slate-700" />
        <p className="mt-3 text-sm text-slate-500">Loading coupons...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex flex-col gap-4 sm:mb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white sm:h-11 sm:w-11 sm:rounded-2xl"><TicketPercent size={19} /></div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Coupons</h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Manage discounts and promotional campaigns.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <button onClick={() => load()} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:px-4 sm:py-3 sm:text-sm">
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 sm:px-5 sm:py-3 sm:text-sm">
              <Plus size={16} /> Create Coupon
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-7 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <Stat title="Total Coupons" value={stats.total} icon={TicketPercent} />
          <Stat title="Active" value={stats.active} icon={Check} />
          <Stat title="Inactive" value={stats.inactive} icon={Power} />
          <Stat title="Expired" value={stats.expired} icon={CalendarDays} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-3 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coupon code..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:bg-white sm:pl-10 sm:pr-4" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto">
                {[["ALL","All"],["ACTIVE","Active"],["INACTIVE","Inactive"],["EXPIRED","Expired"]].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold sm:px-4 sm:text-sm ${filter === v ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Coupon","Discount","Minimum Order","Expiry","Status","Actions"].map((h,i) => (
                    <th key={h} className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100"><TicketPercent size={16} /></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{c.code}</span>
                            <button onClick={() => copy(c.code)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><Copy size={13} /></button>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">{c.discountType === "PERCENTAGE" ? "Percentage coupon" : "Fixed amount coupon"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : money(c.discountValue)}</p>
                      {c.discountType === "PERCENTAGE" && Number(c.maxDiscount) > 0 && <p className="mt-1 text-xs text-slate-400">Max {money(c.maxDiscount)}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{money(c.minOrderAmount)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{dateText(c.expiryDate)}</td>
                    <td className="px-5 py-4"><StatusBadge coupon={c} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => toggle(c)} disabled={statusOf(c) === "expired"} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Power size={15} /></button>
                        <button onClick={() => openEdit(c)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteTarget(c)} className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map((c) => (
              <div key={c._id} className="p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100"><TicketPercent size={16} /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-bold text-slate-900">{c.code}</span>
                        <button onClick={() => copy(c.code)} className="shrink-0 text-slate-400"><Copy size={13} /></button>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `${money(c.discountValue)} OFF`}</p>
                    </div>
                  </div>
                  <StatusBadge coupon={c} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Minimum Order</p><p className="mt-1 text-sm font-bold text-slate-800">{money(c.minOrderAmount)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Expiry</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{dateText(c.expiryDate)}</p></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={() => toggle(c)} disabled={statusOf(c) === "expired"} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40"><Power size={14} />{c.isActive ? "Disable" : "Enable"}</button>
                  <button onClick={() => openEdit(c)} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-semibold text-slate-600"><Pencil size={14} />Edit</button>
                  <button onClick={() => setDeleteTarget(c)} className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-100 px-2 py-2.5 text-xs font-semibold text-red-500"><Trash2 size={14} />Delete</button>
                </div>
              </div>
            ))}
          </div>

          {!filtered.length && (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><TicketPercent size={22} className="text-slate-500" /></div>
              <h3 className="mt-4 font-bold text-slate-900">{search ? "No coupons found" : "No coupons yet"}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{search ? "Try another code or status." : "Create your first coupon to start offering discounts."}</p>
              {!search && <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"><Plus size={16} />Create Coupon</button>}
            </div>
          )}
        </div>

        <p className="mt-3 px-1 text-xs text-slate-400">Showing {filtered.length} of {coupons.length} coupons</p>
      </div>

      <CouponModal open={modal} editing={editing} form={form} setForm={setForm} onClose={() => !saving && setModal(false)} onSubmit={submit} saving={saving} />
      <DeleteModal coupon={deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={remove} deleting={deleting} />
    </div>
  );
};

export default Coupons;
