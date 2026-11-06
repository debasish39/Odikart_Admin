import { useEffect, useState } from "react";

import {
  Check,
  X,
  Eye,
  RefreshCw,
  Search,
  Users,
  Clock3,
  Mail,
  CalendarDays,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import adminApi from "../../services/adminApi";

const PENDING_SELLERS_CACHE_KEY = "odikart_admin_pending_sellers_cache_v1";
const PENDING_SELLERS_CACHE_TTL = 5 * 60 * 1000;

const readPendingSellersCache = () => {
  try {
    const raw = localStorage.getItem(PENDING_SELLERS_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const isValid =
      cached &&
      Array.isArray(cached.sellers) &&
      typeof cached.savedAt === "number" &&
      Date.now() - cached.savedAt < PENDING_SELLERS_CACHE_TTL;

    if (!isValid) {
      localStorage.removeItem(PENDING_SELLERS_CACHE_KEY);
      return null;
    }

    return cached.sellers;
  } catch (error) {
    console.warn("Unable to read pending sellers cache:", error);
    try {
      localStorage.removeItem(PENDING_SELLERS_CACHE_KEY);
    } catch {
      // Ignore localStorage access errors.
    }
    return null;
  }
};

const writePendingSellersCache = (sellers) => {
  try {
    localStorage.setItem(
      PENDING_SELLERS_CACHE_KEY,
      JSON.stringify({
        sellers: Array.isArray(sellers) ? sellers : [],
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Unable to save pending sellers cache:", error);
  }
};

const PendingSellers = () => {
  const navigate = useNavigate();

  const [sellers, setSellers] = useState(() => readPendingSellersCache() || []);
  const [loading, setLoading] = useState(() => readPendingSellersCache() === null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState("");

  const loadSellers = async (silent = false) => {
    try {
      if (!silent && sellers.length === 0) setLoading(true);
      setError("");

      const response = await adminApi.get("/admin/sellers/pending");
      const freshSellers = response.data.sellers || [];

      setSellers(freshSellers);
      writePendingSellersCache(freshSellers);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || "Unable to load seller applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers(true);
  }, []);

  const approveSeller = async (sellerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this seller?"
    );
    if (!confirmed) return;

    try {
      setProcessingId(sellerId);
      await adminApi.put(`/admin/seller/${sellerId}/approve`);
      await loadSellers(true);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to approve seller.");
    } finally {
      setProcessingId("");
    }
  };

  const rejectSeller = async (sellerId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason?.trim()) return;

    try {
      setProcessingId(sellerId);
      await adminApi.put(`/admin/seller/${sellerId}/reject`, {
        reason: reason.trim(),
      });
      await loadSellers(true);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to reject seller.");
    } finally {
      setProcessingId("");
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const name = `${seller.firstName || ""} ${seller.lastName || ""}`.trim();
    const query = search.trim().toLowerCase();
    return (
      !query ||
      name.toLowerCase().includes(query) ||
      (seller.email || "").toLowerCase().includes(query)
    );
  });

  const getSellerName = (seller) =>
    `${seller.firstName || ""} ${seller.lastName || ""}`.trim() ||
    "Unknown Seller";

  const getInitials = (seller) => {
    const name = getSellerName(seller);
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  };

  const formatAppliedDate = (date) => {
    if (!date) return "Date unavailable";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Date unavailable"
      : parsed.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Page heading */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              SELLER MANAGEMENT
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pending sellers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Review new seller applications and decide who can start selling on OdiKart.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadSellers(true)}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh applications
          </button>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Users size={17} />
            Application queue
          </div>
          <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-inset ring-amber-300/20">
            {sellers.length} awaiting review
          </span>
        </div>
      </div>

      {/* Summary and search */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(260px,380px)]">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock3 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Needs your attention</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {sellers.length}
              </span>
              <span className="text-xs text-slate-500">pending applications</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm shadow-slate-900/[0.03] transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search seller name or email..."
            className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => loadSellers(true)}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Applications */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04]">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">Seller applications</h2>
            <p className="mt-1 text-xs text-slate-500">
              {search
                ? `${filteredSellers.length} matching application${filteredSellers.length === 1 ? "" : "s"}`
                : "Applications waiting for review"}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending review
          </span>
        </div>

        {loading && sellers.length === 0 ? (
          <div className="space-y-4 p-6 sm:p-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex animate-pulse items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
                </div>
                <div className="hidden h-9 w-28 rounded-xl bg-slate-100 sm:block" />
              </div>
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              {search ? <Search size={27} /> : <Check size={28} />}
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {search ? "No matching sellers" : "All caught up!"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {search
                ? "Try another seller name or email address."
                : "There are no pending seller applications right now. New applications will appear here."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50/80 text-left">
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Seller</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Applied on</th>
                    <th className="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSellers.map((seller) => {
                    const busy = processingId === seller._id;
                    return (
                      <tr key={seller._id} className="group transition hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
                              {getInitials(seller)}
                            </div>
                            <div className="font-semibold text-slate-900">{getSellerName(seller)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={15} className="text-slate-400" />
                            {seller.email || "No email provided"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={15} className="text-slate-400" />
                            {formatAppliedDate(seller.sellerAppliedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/sellers/${seller._id}`)}
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                            >
                              <Eye size={15} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => approveSeller(seller._id)}
                              disabled={Boolean(processingId)}
                              title="Approve seller"
                              className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectSeller(seller._id)}
                              disabled={Boolean(processingId)}
                              title="Reject seller"
                              className="rounded-xl bg-rose-50 p-2.5 text-rose-600 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredSellers.map((seller) => {
                const busy = processingId === seller._id;
                return (
                  <article key={seller._id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-200/60">
                        {getInitials(seller)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900">{getSellerName(seller)}</h3>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200/70">
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {seller.email || "No email provided"}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays size={13} />
                          Applied {formatAppliedDate(seller.sellerAppliedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_1fr_1fr] gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/sellers/${seller._id}`)}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => approveSeller(seller._id)}
                        disabled={Boolean(processingId)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectSeller(seller._id)}
                        disabled={Boolean(processingId)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
      <p className="text-center text-xs text-slate-400">
        Seller application data refreshes automatically when this page opens.
      </p>
    </div>
  );
};

export default PendingSellers;
