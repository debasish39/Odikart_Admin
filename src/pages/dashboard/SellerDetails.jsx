
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  BadgeCheck,
  Store,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import adminApi from "../../services/adminApi";

const SellerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadSeller = async () => {
    try {
      setError("");
      const response = await adminApi.get(`/admin/seller/${id}`);
      setSeller(response.data.seller || null);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || "Unable to load seller details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSeller();
  }, [id]);

  const approve = async () => {
    if (!window.confirm("Approve this seller?")) return;

    try {
      setProcessing(true);
      await adminApi.put(`/admin/seller/${id}/approve`);
      await loadSeller();
      alert("Seller approved successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to approve seller.");
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason?.trim()) return;

    try {
      setProcessing(true);
      await adminApi.put(`/admin/seller/${id}/reject`, {
        reason: reason.trim(),
      });
      await loadSeller();
      alert("Seller rejected successfully.");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to reject seller.");
    } finally {
      setProcessing(false);
    }
  };

  const name =
    `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim() ||
    "Seller";

  const status = (seller?.sellerStatus || "unknown").toLowerCase();
  const statusStyles =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "rejected"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : status === "pending"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  const verificationStatus =
    seller?.sellerVerificationStatus ||
    seller?.sellerInfo?.verification?.status ||
    "Pending";

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-7">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-100" />
            <div className="space-y-3">
              <div className="h-5 w-48 rounded bg-slate-100" />
              <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle size={25} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Seller details unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || "We couldn't find this seller record."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={loadSeller}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Retry
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/sellers/pending")}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to sellers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back
        </button>
        <button
          type="button"
          onClick={loadSeller}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh details
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Seller profile hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-bold text-white shadow-inner sm:h-20 sm:w-20">
              {name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() || "")
                .join("")}
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-100">
                <Store size={12} />
                SELLER PROFILE
              </div>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {name}
              </h1>
              <p className="mt-1 break-all text-sm text-slate-300">
                {seller.email || "No email provided"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold capitalize ring-1 ring-inset ${statusStyles}`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {seller.sellerStatus || "Unknown"}
          </span>
        </div>

        <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Mail size={17} className="text-blue-300" />
            <span className="break-all">{seller.email || "Email not available"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Phone size={17} className="text-blue-300" />
            <span>{seller.phone || "Phone not available"}</span>
          </div>
        </div>
      </section>

      {/* Detail cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={19} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Seller information</h2>
              <p className="text-xs text-slate-500">Personal and contact details</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <Info label="First name" value={seller.firstName} />
            <Info label="Last name" value={seller.lastName} />
            <Info label="Email address" value={seller.email} />
            <Info label="Phone number" value={seller.phone} />
            <Info label="Seller status" value={seller.sellerStatus} capitalize />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Verification</h2>
              <p className="text-xs text-slate-500">Seller application verification details</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <Info label="KYC status" value={verificationStatus} capitalize />
            <Info label="Application submitted" value={formatDate(seller.sellerAppliedAt)} />
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
            <BadgeCheck size={18} className="mt-0.5 shrink-0 text-slate-500" />
            <p className="text-xs leading-5 text-slate-500">
              Verification status is displayed from the seller record. Review the submitted information before making an approval decision.
            </p>
          </div>
        </section>
      </div>

      {/* Admin decision */}
      {status === "pending" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <h2 className="font-bold text-slate-900">Admin decision</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Review the seller profile before approving or rejecting this application.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={approve}
              disabled={processing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={18} />
              {processing ? "Please wait..." : "Approve seller"}
            </button>
            <button
              type="button"
              onClick={reject}
              disabled={processing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={18} />
              {processing ? "Please wait..." : "Reject seller"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

const Info = ({ label, value, capitalize = false }) => (
  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <span className="text-sm text-slate-500">{label}</span>
    <span
      className={`break-words text-sm font-semibold text-slate-800 sm:max-w-[65%] sm:text-right ${
        capitalize ? "capitalize" : ""
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

export default SellerDetails;
