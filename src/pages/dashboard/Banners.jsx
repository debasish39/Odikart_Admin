import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Image as ImageIcon, Edit3, Trash2, Eye,
  MousePointerClick, CalendarDays, X, UploadCloud, RefreshCw,
  Monitor, Smartphone, ToggleLeft, ToggleRight, Layers3,
  TrendingUp, ArrowUpRight, ExternalLink, Sparkles, Clock3,
  CheckCircle2, AlertCircle, ChevronDown, Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
} from "../../services/bannerApi";

const INITIAL_FORM = {
  title: "",
  subtitle: "",
  buttonText: "",
  placement: "home_main",
  redirectType: "none",
  redirectId: "",
  redirectUrl: "",
  startDate: "",
  endDate: "",
  priority: 1,
  isActive: true,
};

const PLACEMENTS = [
  { value: "home_main", label: "Home main" },
  { value: "daily_deals", label: "Daily deals" },
  { value: "category", label: "Category" },
  { value: "popup", label: "Popup" },
];

const REDIRECT_TYPES = [
  { value: "none", label: "No redirect" },
  { value: "category", label: "Category" },
  { value: "product", label: "Product" },
  { value: "collection", label: "Collection" },
  { value: "url", label: "External URL" },
];

const number = (value) => (Number(value) || 0).toLocaleString("en-IN");

const formatDate = (date) => {
  if (!date) return "Not scheduled";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";
  return parsed.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const toLocalDateTime = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
};

const getStatus = (banner) => {
  const now = Date.now();
  if (!banner.isActive) return "Inactive";
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return "Scheduled";
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return "Expired";
  return "Active";
};

const statusClasses = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Scheduled: "bg-blue-50 text-blue-700 ring-blue-600/15",
  Expired: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState("");
  const [mobilePreview, setMobilePreview] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadBanners = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      const response = await getAdminBanners();
      setBanners(Array.isArray(response?.banners) ? response.banners : []);
    } catch (error) {
      console.error("Load banners error:", error);
      toast.error(error.response?.data?.message || "Couldn't load banners");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBanners(); }, []);

  const stats = useMemo(() => ({
    total: banners.length,
    active: banners.filter((item) => getStatus(item) === "Active").length,
    scheduled: banners.filter((item) => getStatus(item) === "Scheduled").length,
    impressions: banners.reduce((sum, item) => sum + (Number(item.impressions) || 0), 0),
    clicks: banners.reduce((sum, item) => sum + (Number(item.clicks) || 0), 0),
  }), [banners]);

  const filtered = useMemo(() => banners.filter((banner) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      banner.title?.toLowerCase().includes(query) ||
      banner.subtitle?.toLowerCase().includes(query);
    const matchesPlacement = placement === "all" || banner.placement === placement;
    const matchesStatus = status === "all" || getStatus(banner).toLowerCase() === status;
    return matchesSearch && matchesPlacement && matchesStatus;
  }), [banners, search, placement, status]);

  const clickRate = stats.impressions
    ? ((stats.clicks / stats.impressions) * 100).toFixed(1)
    : "0.0";

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const clearPreviews = () => {
    if (desktopPreview.startsWith("blob:")) URL.revokeObjectURL(desktopPreview);
    if (mobilePreview.startsWith("blob:")) URL.revokeObjectURL(mobilePreview);
  };

  const closeModal = () => {
    clearPreviews();
    setModalOpen(false);
    setEditing(null);
    setForm(INITIAL_FORM);
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
  };

  const openCreate = () => {
    closeModal();
    setModalOpen(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      buttonText: banner.buttonText || "",
      placement: banner.placement || "home_main",
      redirectType: banner.redirectType || "none",
      redirectId: banner.redirectId || "",
      redirectUrl: banner.redirectUrl || "",
      startDate: toLocalDateTime(banner.startDate),
      endDate: toLocalDateTime(banner.endDate),
      priority: banner.priority ?? 1,
      isActive: Boolean(banner.isActive),
    });
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview(banner.image?.url || "");
    setMobilePreview(banner.mobileImage?.url || "");
    setModalOpen(true);
  };

  const chooseImage = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP)");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      event.target.value = "";
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === "desktop") {
      if (desktopPreview.startsWith("blob:")) URL.revokeObjectURL(desktopPreview);
      setDesktopFile(file);
      setDesktopPreview(preview);
    } else {
      if (mobilePreview.startsWith("blob:")) URL.revokeObjectURL(mobilePreview);
      setMobileFile(file);
      setMobilePreview(preview);
    }
  };

  const submitBanner = async (event) => {
    event.preventDefault();
    if (!editing && !desktopFile) return toast.error("Please upload the main banner image");
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      return toast.error("End date must be after start date");
    }
    if (form.redirectType === "url" && form.redirectUrl && !/^https?:\/\//i.test(form.redirectUrl)) {
      return toast.error("Enter a valid URL starting with http:// or https://");
    }

    try {
      setSaving(true);
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "startDate" || key === "endDate") {
          body.append(key, value ? new Date(value).toISOString() : "");
        } else {
          body.append(key, String(value));
        }
      });
      if (desktopFile) body.append("image", desktopFile);
      if (mobileFile) body.append("mobileImage", mobileFile);

      if (editing) {
        await updateBanner(editing._id, body);
        toast.success("Banner updated");
      } else {
        await createBanner(body);
        toast.success("Banner created");
      }
      closeModal();
      await loadBanners(true);
    } catch (error) {
      console.error("Save banner error:", error);
      toast.error(error.response?.data?.message || "Couldn't save banner");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (banner) => {
    try {
      await updateBannerStatus(banner._id, !banner.isActive);
      toast.success(banner.isActive ? "Banner paused" : "Banner enabled");
      await loadBanners(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't update banner status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget._id);
      toast.success("Banner deleted");
      setDeleteTarget(null);
      await loadBanners(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't delete banner");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-lg shadow-blue-600/20">
              <Megaphone size={23} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Banners</h1>
                <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-yellow-700 ">Storefront</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Create campaigns, manage placements and keep your storefront fresh.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => loadBanners(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-yellow-300/20 transition hover:-translate-y-0.5 ">
              <Plus size={18} /> Create banner
            </button>
          </div>
        </header>

        {/* Overview metrics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total banners" value={number(stats.total)} helper="Across all placements" icon={<Layers3 size={19} />} tone="blue" />
          <MetricCard label="Live banners" value={number(stats.active)} helper="Currently eligible to display" icon={<CheckCircle2 size={19} />} tone="green" />
          <MetricCard label="Impressions" value={number(stats.impressions)} helper="Total banner views" icon={<Eye size={19} />} tone="violet" />
          <MetricCard label="Click-through rate" value={`${clickRate}%`} helper={`${number(stats.clicks)} total clicks`} icon={<TrendingUp size={19} />} tone="amber" />
        </section>

        {/* Campaign overview strip */}
        <section className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><Sparkles size={19} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Campaign overview</p>
              <p className="text-xs text-slate-500">{stats.scheduled} scheduled campaign{stats.scheduled === 1 ? "" : "s"} waiting to go live.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live: {stats.active}
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled: {stats.scheduled}
          </div>
        </section>

        {/* Search and filters */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">All campaigns <span className="ml-1 text-sm font-medium text-slate-400">({filtered.length})</span></h2>
              <p className="mt-0.5 text-xs text-slate-500">Manage the banners visible across your OdiKart app.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
              </div>
              <div className="relative">
                <select value={placement} onChange={(e) => setPlacement(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-400 sm:w-44">
                  <option value="all">All placements</option>
                  {PLACEMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ value: "all", label: "All banners" }, { value: "active", label: "Active" }, { value: "scheduled", label: "Scheduled" }, { value: "inactive", label: "Inactive" }, { value: "expired", label: "Expired" }].map((tab) => (
              <button key={tab.value} onClick={() => setStatus(tab.value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${status === tab.value ? "bg-slate-900 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                {tab.label}
                {tab.value === "all" && <span className={`ml-2 ${status === "all" ? "text-slate-300" : "text-slate-400"}`}>{banners.length}</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Campaign grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[16/8] animate-pulse bg-slate-200" /><div className="space-y-3 p-5"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-3 w-full animate-pulse rounded bg-slate-100" /><div className="h-10 animate-pulse rounded-xl bg-slate-100" /></div></div>)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><ImageIcon size={25} /></div>
            <h3 className="mt-4 text-base font-bold text-slate-800">No banners found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Try another search or filter, or create a new campaign to promote something special.</p>
            <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Create banner</button>
          </div>
        ) : (
          <div className="grid items-start gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((banner) => <BannerCard key={banner._id} banner={banner} onEdit={() => openEdit(banner)} onDelete={() => setDeleteTarget(banner)} onToggle={() => toggleStatus(banner)} />)}
          </div>
        )}

        <p className="pb-2 text-center text-[11px] text-slate-400">Banner visibility on the storefront is controlled by its enabled status and schedule.</p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) closeModal(); }}>
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Megaphone size={19} /></div>
                <div><h2 className="font-bold text-slate-900">{editing ? "Edit campaign" : "Create campaign"}</h2><p className="mt-0.5 text-xs text-slate-500">Add creative, choose placement and set when it appears.</p></div>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
            </div>

            <form onSubmit={submitBanner} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-7 px-5 py-6 sm:px-7">
                <FormSection number="01" title="Creative assets" description="Use a wide image for desktop and a portrait-friendly version for mobile.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ImagePicker title="Main banner image" subtitle="Recommended: wide landscape · Max 5 MB" icon={<Monitor size={17} />} preview={desktopPreview} required={!editing} onChange={(e) => chooseImage(e, "desktop")} />
                    <ImagePicker title="Mobile banner image" subtitle="Optional · Use a portrait crop" icon={<Smartphone size={17} />} preview={mobilePreview} onChange={(e) => chooseImage(e, "mobile")} />
                  </div>
                </FormSection>

                <FormSection number="02" title="Campaign details" description="Give your banner a clear message customers can understand quickly.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Campaign title" required><input required maxLength={100} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Diwali Mega Sale" className="control" /></InputField>
                    <InputField label="Button label"><input maxLength={30} value={form.buttonText} onChange={(e) => setField("buttonText", e.target.value)} placeholder="Shop now" className="control" /></InputField>
                    <div className="md:col-span-2"><InputField label="Subtitle"><textarea rows={2} maxLength={180} value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} placeholder="Add a short supporting message..." className="control resize-y" /></InputField></div>
                    <InputField label="Store placement" required><select value={form.placement} onChange={(e) => setField("placement", e.target.value)} className="control">{PLACEMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></InputField>
                    <InputField label="Display priority"><input type="number" min="0" value={form.priority} onChange={(e) => setField("priority", e.target.value)} className="control" /><span className="mt-1 block text-[11px] text-slate-400">Higher numbers are shown first.</span></InputField>
                  </div>
                </FormSection>

                <FormSection number="03" title="Click destination" description="Choose where customers should go after tapping this banner.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Destination type"><select value={form.redirectType} onChange={(e) => setField("redirectType", e.target.value)} className="control">{REDIRECT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></InputField>
                    {["category", "product", "collection"].includes(form.redirectType) && <InputField label="Destination ID"><input value={form.redirectId} onChange={(e) => setField("redirectId", e.target.value)} placeholder="Paste category / product ID" className="control" /></InputField>}
                    {form.redirectType === "url" && <InputField label="Destination URL"><input type="url" value={form.redirectUrl} onChange={(e) => setField("redirectUrl", e.target.value)} placeholder="https://example.com" className="control" /></InputField>}
                  </div>
                </FormSection>

                <FormSection number="04" title="Schedule & visibility" description="Leave dates empty if this banner should not have a time limit.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Start date & time"><input type="datetime-local" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} className="control" /></InputField>
                    <InputField label="End date & time"><input type="datetime-local" min={form.startDate || undefined} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} className="control" /></InputField>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}><CheckCircle2 size={19} /></div><div><p className="text-sm font-semibold text-slate-800">Campaign enabled</p><p className="mt-0.5 text-xs text-slate-500">The banner can display when its schedule allows.</p></div></div>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setField("isActive", e.target.checked)} className="h-5 w-5 accent-blue-600" />
                  </label>
                </FormSection>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={17} />}
                  {saving ? "Saving campaign..." : editing ? "Save changes" : "Publish campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><Trash2 size={21} /></div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Delete this banner?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">“{deleteTarget.title}” will be permanently removed. This action cannot be undone.</p>
            <div className="mt-6 flex gap-2"><button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button onClick={confirmDelete} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Delete banner</button></div>
          </div>
        </div>
      )}

      <style>{`
        .control { width:100%; border:1px solid #e2e8f0; border-radius:12px; background:#fff; padding:11px 13px; color:#334155; font-size:13px; outline:none; transition:border-color .18s, box-shadow .18s; }
        .control::placeholder { color:#a1aab8; }
        .control:focus { border-color:#60a5fa; box-shadow:0 0 0 4px rgba(59,130,246,.10); }
      `}</style>
    </div>
  );
}

function MetricCard({ label, value, helper, icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div></div>
      <p className="mt-3 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function BannerCard({ banner, onEdit, onDelete, onToggle }) {
  const currentStatus = getStatus(banner);
  const placementLabel = PLACEMENTS.find((item) => item.value === banner.placement)?.label || banner.placement;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
        {banner.image?.url ? <img src={banner.image.url} alt={banner.title || "Banner"} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon size={36} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${statusClasses[currentStatus]}`}><span className={`h-1.5 w-1.5 rounded-full ${currentStatus === "Active" ? "bg-emerald-500" : currentStatus === "Scheduled" ? "bg-blue-500" : currentStatus === "Expired" ? "bg-rose-500" : "bg-slate-400"}`} />{currentStatus}</span>
        <span className="absolute bottom-3 right-3 rounded-lg bg-slate-950/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">Priority {banner.priority ?? 1}</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-base font-bold text-slate-900">{banner.title || "Untitled banner"}</h3><p className="mt-1 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{banner.subtitle || "No campaign description added."}</p></div><button onClick={onEdit} title="Edit campaign" className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"><Edit3 size={16} /></button></div>
        <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">{placementLabel}</span><span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-semibold capitalize text-indigo-700">{banner.redirectType || "no redirect"}</span>{banner.mobileImage?.url && <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">Mobile image</span>}</div>
        <div className="mt-4 grid grid-cols-2 divide-x divide-slate-100 rounded-xl bg-slate-50 px-3 py-3"><div className="pr-3"><div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400"><Eye size={13} /> Impressions</div><p className="mt-1 text-lg font-bold text-slate-800">{number(banner.impressions)}</p></div><div className="pl-4"><div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400"><MousePointerClick size={13} /> Clicks</div><p className="mt-1 text-lg font-bold text-slate-800">{number(banner.clicks)}</p></div></div>
        <div className="mt-4 space-y-2 text-[11px] text-slate-500"><div className="flex items-center gap-2"><CalendarDays size={13} className="shrink-0 text-slate-400" /><span className="w-11 shrink-0 font-semibold text-slate-400">Starts</span><span className="truncate">{formatDate(banner.startDate)}</span></div><div className="flex items-center gap-2"><Clock3 size={13} className="shrink-0 text-slate-400" /><span className="w-11 shrink-0 font-semibold text-slate-400">Ends</span><span className="truncate">{formatDate(banner.endDate)}</span></div></div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><button onClick={onToggle} className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${banner.isActive ? "text-emerald-700 hover:text-emerald-800" : "text-slate-500 hover:text-slate-700"}`}>{banner.isActive ? <ToggleRight size={21} /> : <ToggleLeft size={21} />}{banner.isActive ? "Enabled" : "Disabled"}</button><div className="flex items-center gap-1"><button onClick={onEdit} className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">Edit campaign</button><button onClick={onDelete} title="Delete campaign" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></div></div>
      </div>
    </article>
  );
}

function FormSection({ number: sectionNumber, title, description, children }) {
  return <section><div className="mb-4 flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-700">{sectionNumber}</span><div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{description}</p></div></div>{children}</section>;
}

function InputField({ label, required, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span>{children}</label>;
}

function ImagePicker({ title, subtitle, icon, preview, required, onChange }) {
  return (
    <div><div className="mb-2 flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-xs font-semibold text-slate-700">{icon}{title}{required && <span className="text-rose-500">*</span>}</p>{preview && <span className="text-[10px] font-semibold text-emerald-600">Image ready</span>}</div>
      <label className={`group relative flex min-h-[170px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed transition ${preview ? "border-blue-200 bg-slate-50" : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/40"}`}>
        {preview ? <><img src={preview} alt={title} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-950/55 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100"><span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700"><UploadCloud size={14} /> Replace image</span></div></> : <><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><UploadCloud size={19} /></div><span className="text-xs font-semibold text-slate-700">Click to upload image</span><span className="mt-1 text-[10px] text-slate-400">{subtitle}</span></>}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onChange} className="sr-only" />
      </label>
      {preview && <p className="mt-1.5 text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  );
}
