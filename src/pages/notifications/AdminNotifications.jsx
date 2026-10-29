

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Search,
  RefreshCw,
  Plus,
  Send,
  Pencil,
  Trash2,
  X,
  Megaphone,
  UserRound,
  CheckCheck,
  ExternalLink,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import {
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
  sendNotificationToUser,
  sendPromotionToAllCustomers,
  uploadNotificationImage,
} from "../../services/notificationApi";

const TYPES = [
  "announcement",
  "offer",
  "promotion",
  "order_update",
  "delivery",
  "account",
  "system",
  "new_product",
  "coupon",
  "flash_sale",
];

const emptyForm = {
  userId: "",
  title: "",
  message: "",
  type: "announcement",
  link: "",
  imageUrl: "",
  isPromotional: false,
};

const getId = (item) => item?._id || item?.id;
const getList = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  return data?.notifications || data?.items || data?.results || [];
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(""); // create | edit | send | broadcast
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await getAdminNotifications();
      setItems(getList(response));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load notifications. Check the API URL, token, and admin routes."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const isRead = Boolean(item.isRead);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !isRead) ||
        (filter === "read" && isRead);
      const text = `${item.title || ""} ${item.message || ""} ${item.type || ""} ${item.userId || ""}`.toLowerCase();
      return matchesFilter && (!term || text.includes(term));
    });
  }, [items, search, filter]);

  const unread = items.filter((item) => !item.isRead).length;
  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModal("create");
    setError("");
  };
  const openEdit = (item) => {
    setSelected(item);
    setForm({
      userId: String(item.userId?._id || item.userId || ""),
      title: item.title || "",
      message: item.message || "",
      type: item.type || "announcement",
      link: item.link || "",
      imageUrl: item.imageUrl || "",
      isPromotional: Boolean(item.isPromotional),
    });
    setModal("edit");
    setError("");
  };
  const openSend = () => {
    setForm(emptyForm);
    setModal("send");
    setError("");
  };
  const openBroadcast = () => {
    setForm({ ...emptyForm, type: "promotion", isPromotional: true, link: "/" });
    setModal("broadcast");
    setError("");
  };

  const closeModal = () => {
    if (saving) return;
    setModal("");
    setSelected(null);
    setForm(emptyForm);
    setError("");
  };

  const handlePromotionImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Choose an image smaller than 8 MB.");
      return;
    }

    setError("");
    setNotice("");
    setUploadingImage(true);
    try {
      const response = await uploadNotificationImage(file);
      const data = response?.data ?? response;
      const uploadedUrl =
        data?.imageUrl || data?.secure_url || data?.url || data?.data?.imageUrl;

      let parsedImageUrl;
      try {
        parsedImageUrl = new URL(uploadedUrl);
      } catch {
        throw new Error("The upload API did not return a valid image URL.");
      }

      if (parsedImageUrl.protocol !== "https:") {
        throw new Error("The uploaded image must use HTTPS.");
      }

      setForm((current) => ({ ...current, imageUrl: parsedImageUrl.href }));
      setNotice("Image uploaded successfully. You can now send the promotion.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Image upload failed. Check the image-upload API and try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const removePromotionImage = () => {
    setForm((current) => ({ ...current, imageUrl: "" }));
    setError("");
    setNotice("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        link: form.link.trim(),
        imageUrl: form.imageUrl.trim(),
        isPromotional: Boolean(form.isPromotional),
      };
      if (!payload.title || (modal !== "broadcast" && !payload.message)) {
        setError(modal === "broadcast" ? "Promotion title is required." : "Title and message are required.");
        return;
      }
      if (payload.imageUrl) {
        try {
          const imageUrl = new URL(payload.imageUrl);
          if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") throw new Error("Invalid protocol");
        } catch {
          setError("Enter a valid image URL beginning with https:// or http://.");
          return;
        }
      }

      if (modal === "create") {
        if (!form.userId.trim()) {
          setError("Enter the customer User ID.");
          return;
        }
        await createAdminNotification({ ...payload, userId: form.userId.trim() });
        setNotice("Notification created successfully.");
      } else if (modal === "edit") {
        await updateAdminNotification(getId(selected), payload);
        setNotice("Notification updated successfully.");
      } else if (modal === "send") {
        if (!form.userId.trim()) {
          setError("Enter the customer User ID.");
          return;
        }
        await sendNotificationToUser({ ...payload, userId: form.userId.trim() });
        setNotice("Notification sent to the customer.");
      } else if (modal === "broadcast") {
        await sendPromotionToAllCustomers({
          title: payload.title,
          message: payload.message,
          link: payload.link || "/",
          imageUrl: payload.imageUrl,
        });
        setNotice("Promotion broadcast request completed.");
      }

      setModal("");
      setSelected(null);
      setForm(emptyForm);
      await load(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Action failed. Confirm that the matching controller and route exist."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const id = getId(item);
    if (!id) return;
    if (!window.confirm(`Delete notification “${item.title || "Untitled"}”?`)) return;
    setError("");
    setNotice("");
    try {
      await deleteAdminNotification(id);
      setItems((current) => current.filter((row) => getId(row) !== id));
      setNotice("Notification deleted.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not delete notification.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 text-slate-900 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
              <Bell size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
              <p className="mt-1 text-sm text-slate-500">Create, manage, and send updates to Odikart customers.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 sm:px-4">
            <Plus size={17} /> Create
          </button>
          <button onClick={openSend} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 sm:px-4">
            <Send size={16} /> Send to user
          </button>
          <button onClick={openBroadcast} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100">
            <Megaphone size={16} /> Broadcast
          </button>
        </div>
      </div>

      {notice && <div role="status" className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800">{notice}</div>}
      {error && !modal && <div role="alert" className="flex items-start gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Total notifications" value={items.length} icon={<Bell size={19} />} tone="blue" />
        <StatCard label="Unread" value={unread} icon={<AlertCircle size={19} />} tone="amber" />
        <StatCard label="Read" value={items.length - unread} icon={<CheckCheck size={19} />} tone="emerald" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, message, type..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100" />
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[{ key: "all", label: "All" }, { key: "unread", label: "Unread" }, { key: "read", label: "Read" }].map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${filter === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={20} /> Loading notifications…</div>
        ) : error && items.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><AlertCircle size={30} className="mb-3 text-slate-700" /><p className="font-semibold text-slate-800">Could not load notifications</p><p className="mt-1 max-w-lg text-sm text-slate-500">{error}</p><button onClick={() => load()} className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Try again</button></div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="rounded-full bg-slate-100 p-4 text-slate-400"><Bell size={26} /></div><p className="mt-4 font-semibold text-slate-800">No notifications found</p><p className="mt-1 text-sm text-slate-500">Try another filter or create a notification.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <article key={getId(item)} className="flex flex-col gap-3 p-3 transition hover:bg-slate-50/80 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
                <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.isRead ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-900"}`}><Bell size={19} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{item.title || "Untitled notification"}</h3>
                    {!item.isRead && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">Unread</span>}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.type || "notification"}</span>
                    {item.isPromotional && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">Promotional</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.message || "No message"}</p>
                  {item.imageUrl && (
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={item.imageUrl}
                        alt={`${item.title || "Notification"} image`}
                        loading="lazy"
                        className="max-h-28 w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </a>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="inline-flex items-center gap-1"><UserRound size={13} /> User: {String(item.userId?._id || item.userId || "—")}</span>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-900 hover:underline">Open link <ExternalLink size={12} /></a>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                  <button onClick={() => openEdit(item)} title="Edit notification" aria-label="Edit notification" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"><Pencil size={16} /></button>
                  <button onClick={() => remove(item)} title="Delete notification" aria-label="Delete notification" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">Showing {filtered.length} of {items.length} notifications</div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="notification-modal-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="notification-modal-title" className="text-xl font-bold text-slate-900">{modal === "create" ? "Create notification" : modal === "edit" ? "Edit notification" : modal === "send" ? "Send to a customer" : "Broadcast promotion"}</h2>
                <p className="mt-1 text-sm text-slate-500">{modal === "broadcast" ? "This will process the promotion for eligible customers." : modal === "edit" ? "Update the notification details." : "Fill in the details below."}</p>
              </div>
              <button onClick={closeModal} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X size={20} /></button>
            </div>

            {error && <div role="alert" className="mb-4 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800">{error}</div>}

            <form onSubmit={submit} className="space-y-4">
              {(modal === "create" || modal === "send") && <Field label="Customer User ID" hint="Use the MongoDB user _id."><input required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="e.g. 66f..." className={inputClass} /></Field>}
              <Field label="Title"><input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Your order is on the way" className={inputClass} /></Field>
              <Field label={modal === "broadcast" ? "Message (optional)" : "Message"}><textarea required={modal !== "broadcast"} rows={4} maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={modal === "broadcast" ? "Optional offer details…" : "Write a clear, helpful message…"} className={`${inputClass} resize-y`} /></Field>
              {modal !== "broadcast" && <Field label="Notification type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>{TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></Field>}
              <Field label="Link (optional)" hint="A relative path like /orders or a full URL."><input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/orders" className={inputClass} /></Field>
              {modal === "broadcast" && (
                <div>
                  <Field
                    label="Promotion image (optional)"
                    hint="Choose an image from your device. It uploads automatically; no URL needs to be pasted."
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePromotionImageChange}
                      disabled={uploadingImage || saving}
                      className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold`}
                    />
                  </Field>

                  {form.imageUrl.trim() && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-600">Image preview</p>
                        <button
                          type="button"
                          onClick={removePromotionImage}
                          className="text-xs font-semibold text-slate-600 underline"
                        >
                          Remove image
                        </button>
                      </div>
                      <img
                        src={form.imageUrl.trim()}
                        alt="Promotion preview"
                        className="max-h-56 w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                  {uploadingImage && (
                    <p className="mt-2 text-sm text-slate-500">Uploading image securely…</p>
                  )}
                </div>
              )}
              {modal !== "broadcast" && <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={form.isPromotional} onChange={(e) => setForm({ ...form, isPromotional: e.target.checked })} className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-1000" /><span><span className="block text-sm font-semibold text-slate-800">Promotional notification</span><span className="mt-0.5 block text-xs text-slate-500">Use for offers, campaigns, and marketing messages.</span></span></label>}
              {modal === "broadcast" && <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">Customers' promotional preferences should be respected by the backend. Check the response for processed, skipped, and failed counts.</div>}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving || uploadingImage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}{uploadingImage ? "Uploading image…" : saving ? "Saving…" : modal === "edit" ? "Save changes" : modal === "broadcast" ? "Send promotion" : modal === "create" ? "Create notification" : "Send notification"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100";

function Field({ label, hint, children }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

function StatCard({ label, value, icon, tone }) {
  const tones = {
    blue: "bg-slate-50 text-slate-900",
    amber: "bg-slate-100 text-slate-800",
    emerald: "bg-slate-100 text-slate-800",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><div className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</div></div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
