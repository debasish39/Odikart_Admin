import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Truck,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Ban,
} from "lucide-react";
import { toast } from "react-hot-toast";
import adminApi from "../../services/adminApi";

/*
  Odikart Admin - Courier Management

  New Courier model:
  - name
  - phone
  - photo
  - vehicleType
  - vehicleNumber
  - serviceAreas
  - estimatedDeliveryMinutes
  - verificationStatus
  - verifiedAt / verifiedBy
  - verificationNote
  - rejectionReason / rejectedAt / rejectedBy
  - documents.aadhaar
  - documents.drivingLicense
  - status
  - isActive
  - showPhoneToCustomer
  - currentLocation
  - locationUpdatedAt
  - isLocationSharing
  - totalDeliveries
  - successfulDeliveries
  - rating
  - joinedAt
  - adminNote

  Expected backend endpoints:
    GET    /api/couriers
    GET    /api/couriers/:id
    POST   /api/couriers
    PUT    /api/couriers/:id
    DELETE /api/couriers/:id
    PUT    /api/couriers/:id/enable

  Verification endpoints used by this UI:
    PUT    /api/couriers/:id/verify
    PUT    /api/couriers/:id/reject
    PUT    /api/couriers/:id/resubmit

  IMPORTANT:
  MongoDB courier IDs are read from _id.
*/

const COURIER_BASE = "/couriers";

const EMPTY_FORM = {
  name: "",
  phone: "",
  photo: "",
  photoFile: null,
  vehicleType: "Bike",
  vehicleNumber: "",
  serviceAreas: "",
  estimatedDeliveryMinutes: 30,
  status: "offline",
  isActive: true,
  showPhoneToCustomer: false,
  isLocationSharing: false,
  adminNote: "",
  aadhaarNumber: "",
  aadhaarFile: null,
  drivingLicenseNumber: "",
  drivingLicenseFile: null,
};

const VEHICLE_TYPES = [
  "Bike",
  "Scooter",
  "Cycle",
  "Auto",
  "Car",
  "Van",
  "Other",
];

const VERIFICATION_STATUSES = [
  "pending",
  "under_review",
  "verified",
  "rejected",
];

const COURIER_STATUSES = [
  "available",
  "busy",
  "offline",
  "suspended",
];

/* =====================================
   HELPERS
===================================== */

const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[a-fA-F0-9]{24}$/.test(String(id));
};

const getCourierId = (courier) => {
  if (!courier) return "";
  return String(courier._id || "");
};

const normalizeCourier = (item) => ({
  ...item,
  _id: item?._id ? String(item._id) : "",
  serviceAreas: Array.isArray(item?.serviceAreas) ? item.serviceAreas : [],
  documents: {
    aadhaar: {
      ...(item?.documents?.aadhaar || {}),
    },
    drivingLicense: {
      ...(item?.documents?.drivingLicense || {}),
    },
  },
});

const getErrorMessage = (
  error,
  fallback = "Something went wrong"
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const verificationLabel = (status) => {
  switch (status) {
    case "verified":
      return "Verified";
    case "under_review":
      return "Under Review";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "available":
      return "Available";
    case "busy":
      return "Busy";
    case "suspended":
      return "Suspended";
    default:
      return "Offline";
  }
};

/* =====================================
   FORM MODAL
===================================== */

function CourierFormModal({
  open,
  mode,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  const isEdit = mode === "edit";
  const isCycle = form.vehicleType === "Cycle";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10";

  const update = (key, value) =>
    onChange((prev) => ({ ...prev, [key]: value }));

  const chooseFile = (key, e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be smaller than 8 MB.");
      e.target.value = "";
      return;
    }

    update(key, file);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEdit ? "Edit Courier" : "Add Courier"}
            </h2>
            <p className="text-xs text-slate-500">
              Complete the courier profile and KYC details.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto p-4 sm:p-5">
          <FormSection title="Personal Information">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Courier Name *">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ramesh Kumar"
                  required
                />
              </Field>

              <Field label="Phone Number *">
                <input
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </Field>

              <FileUpload
                label="Courier Photo"
                accept="image/*"
                capture="user"
                file={form.photoFile}
                existingUrl={form.photo}
                onChange={(e) => chooseFile("photoFile", e)}
                helper="Choose from Photos or take a photo with the camera."
              />
            </div>
          </FormSection>

          <FormSection
            title="Vehicle & Delivery"
            subtitle="Driving Licence is not required for Cycle couriers."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Vehicle Type *">
                <select
                  className={inputClass}
                  value={form.vehicleType}
                  onChange={(e) => {
                    const vehicleType = e.target.value;
                    onChange((prev) => ({
                      ...prev,
                      vehicleType,
                      ...(vehicleType === "Cycle"
                        ? {
                            vehicleNumber: "",
                            drivingLicenseNumber: "",
                            drivingLicenseFile: null,
                          }
                        : {}),
                    }));
                  }}
                  required
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>

              {!isCycle && (
                <Field label="Vehicle Number *">
                  <input
                    className={inputClass}
                    value={form.vehicleNumber}
                    onChange={(e) =>
                      update("vehicleNumber", e.target.value.toUpperCase())
                    }
                    placeholder="OD02AB1234"
                    required
                  />
                </Field>
              )}

              <Field label="Estimated Delivery (minutes) *">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.estimatedDeliveryMinutes}
                  onChange={(e) =>
                    update("estimatedDeliveryMinutes", e.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Courier Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  {COURIER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Service Areas *" className="md:col-span-2">
                <input
                  className={inputClass}
                  value={form.serviceAreas}
                  onChange={(e) => update("serviceAreas", e.target.value)}
                  placeholder="Berhampur, Ganjam, Chhatrapur"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Separate areas with commas.
                </p>
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="KYC / Identity Documents"
            subtitle={
              isCycle
                ? "Aadhaar is required. Driving Licence is not required for Cycle."
                : "Aadhaar and Driving Licence are required for verification."
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Aadhaar Number *">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={12}
                  value={form.aadhaarNumber}
                  onChange={(e) =>
                    update(
                      "aadhaarNumber",
                      e.target.value.replace(/\D/g, "").slice(0, 12)
                    )
                  }
                  placeholder="12-digit Aadhaar number"
                  required={!isEdit}
                />
              </Field>

              <FileUpload
                label="Aadhaar Card *"
                accept="image/*"
                capture="environment"
                file={form.aadhaarFile}
                onChange={(e) => chooseFile("aadhaarFile", e)}
                helper="Choose from Photos or scan/take a camera photo."
                required={!isEdit}
              />

              {!isCycle && (
                <>
                  <Field label="Driving Licence Number *">
                    <input
                      className={inputClass}
                      value={form.drivingLicenseNumber}
                      onChange={(e) =>
                        update(
                          "drivingLicenseNumber",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="Driving Licence number"
                      required={!isEdit}
                    />
                  </Field>

                  <FileUpload
                    label="Driving Licence *"
                    accept="image/*"
                    capture="environment"
                    file={form.drivingLicenseFile}
                    onChange={(e) =>
                      chooseFile("drivingLicenseFile", e)
                    }
                    helper="Choose from Photos or scan/take a camera photo."
                    required={!isEdit}
                  />
                </>
              )}

              {isCycle && (
                <div className="md:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 size={16} />
                    Driving Licence not required for Cycle
                  </div>
                  <p className="mt-1 text-xs">
                    The DL field is hidden and no Driving Licence is sent to the backend.
                  </p>
                </div>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Operations & Admin"
            subtitle="Settings used by the admin and delivery system."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Toggle
                label="Active"
                checked={form.isActive}
                onChange={(value) => update("isActive", value)}
              />
              <Toggle
                label="Show Phone to Customer"
                checked={form.showPhoneToCustomer}
                onChange={(value) =>
                  update("showPhoneToCustomer", value)
                }
              />
              <Toggle
                label="Location Sharing"
                checked={form.isLocationSharing}
                onChange={(value) =>
                  update("isLocationSharing", value)
                }
              />
            </div>

            <div className="mt-4">
              <Field label="Admin Note">
                <textarea
                  rows={3}
                  maxLength={1000}
                  className={inputClass}
                  value={form.adminNote}
                  onChange={(e) =>
                    update("adminNote", e.target.value)
                  }
                  placeholder="Internal admin note"
                />
              </Field>
            </div>
          </FormSection>

          <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Verification:</strong> Aadhaar is required for all couriers.
            DL is required for motor vehicles and hidden for Cycle. Verify only
            after the documents have been checked.
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Courier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function FileUpload({
  label,
  accept,
  capture,
  file,
  existingUrl,
  onChange,
  helper,
  required = false,
}) {
  const id = `courier-file-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <Field label={label}>
      <label
        htmlFor={id}
        className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 hover:border-slate-400 hover:bg-slate-100"
      >
        <input
          id={id}
          type="file"
          accept={accept}
          capture={capture}
          onChange={onChange}
          required={required && !file && !existingUrl}
          className="sr-only"
        />
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
            <FileCheck2 size={19} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {file?.name ||
                (existingUrl ? "Existing file" : "Choose file")}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {helper}
            </p>
          </div>
        </div>
      </label>
      {file && (
        <p className="mt-1 truncate text-[11px] text-emerald-600">
          Selected: {file.name}
        </p>
      )}
    </Field>
  );
}

/* =====================================
   FIELD
===================================== */

function Field({
  label,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

/* =====================================
   TOGGLE
===================================== */

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-black" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

/* =====================================
   DETAILS MODAL
===================================== */

function CourierDetailsModal({
  courier,
  onClose,
  onVerify,
  onReject,
  verifying,
}) {
  if (!courier) return null;

  const courierId = getCourierId(courier);
  const canVerify =
    courier.verificationStatus !== "verified";

  const aadhaar =
    courier.documents?.aadhaar || {};

  const drivingLicense =
    courier.documents?.drivingLicense || {};

  const coordinates =
    courier.currentLocation?.coordinates;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <CourierAvatar courier={courier} size="md" />

            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-900">
                {courier.name || "Courier"}
              </h2>

              <p className="truncate text-xs text-slate-500">
                ID: {courierId || "Unavailable"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* ID WARNING */}
          {!isValidObjectId(courierId) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Invalid courier ID. This courier record does not contain
              a valid MongoDB ObjectId.
            </div>
          )}

          {/* BASIC */}
          <section>
            <SectionTitle icon={<Truck size={15} />}>
              Courier Information
            </SectionTitle>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info
                label="Name"
                value={courier.name || "—"}
              />

              <Info
                label="Phone"
                value={courier.phone || "—"}
              />

              <Info
                label="Vehicle"
                value={courier.vehicleType || "—"}
              />

              <Info
                label="Vehicle Number"
                value={courier.vehicleNumber || "—"}
              />

              <Info
                label="Courier Status"
                value={statusLabel(courier.status)}
              />

              <Info
                label="Active"
                value={courier.isActive ? "Yes" : "No"}
              />

              <Info
                label="Estimated Delivery"
                value={`${courier.estimatedDeliveryMinutes ?? "—"} minutes`}
              />

              <Info
                label="Rating"
                value={`${courier.rating ?? 0} / 5`}
              />

              <Info
                label="Total Deliveries"
                value={courier.totalDeliveries ?? 0}
              />

              <Info
                label="Successful Deliveries"
                value={courier.successfulDeliveries ?? 0}
              />
            </div>
          </section>

          {/* VERIFICATION */}
          <section>
            <SectionTitle icon={<ShieldCheck size={15} />}>
              Verification
            </SectionTitle>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <VerificationBadge
                  status={courier.verificationStatus}
                />

                {courier.verifiedAt && (
                  <span className="text-xs text-slate-500">
                    Verified:{" "}
                    {new Date(
                      courier.verifiedAt
                    ).toLocaleString()}
                  </span>
                )}
              </div>

              {courier.verificationNote && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  {courier.verificationNote}
                </p>
              )}

              {courier.rejectionReason && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-red-500">
                    Rejection Reason
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {courier.rejectionReason}
                  </p>
                </div>
              )}

              {canVerify && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={
                      verifying ||
                      !isValidObjectId(courierId)
                    }
                    onClick={() =>
                      onVerify(courierId)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    {verifying
                      ? "Processing..."
                      : "Verify Courier"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      verifying ||
                      !isValidObjectId(courierId)
                    }
                    onClick={() =>
                      onReject(courierId)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject Courier
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* DOCUMENTS */}
          <section>
            <SectionTitle icon={<FileCheck2 size={15} />}>
              KYC Documents
            </SectionTitle>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DocumentCard
                title="Aadhaar Card"
                document={aadhaar}
              />

              {courier.vehicleType !== "Cycle" && (
                <DocumentCard
                  title="Driving Licence"
                  document={drivingLicense}
                />
              )}
            </div>
          </section>

          {/* LOCATION */}
          <section>
            <SectionTitle icon={<MapPin size={15} />}>
              Live Location
            </SectionTitle>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Info
                  label="Location Sharing"
                  value={
                    courier.isLocationSharing
                      ? "Enabled"
                      : "Disabled"
                  }
                />

                <Info
                  label="Location Updated"
                  value={
                    courier.locationUpdatedAt
                      ? new Date(
                          courier.locationUpdatedAt
                        ).toLocaleString()
                      : "Never"
                  }
                />
              </div>

              {Array.isArray(coordinates) &&
              coordinates.length === 2 ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <span className="font-bold">
                    Coordinates:
                  </span>{" "}
                  {coordinates[1]}, {coordinates[0]}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No current location available.
                </p>
              )}
            </div>
          </section>

          {/* SERVICE AREAS */}
          <section>
            <SectionTitle icon={<MapPin size={15} />}>
              Service Areas
            </SectionTitle>

            <div className="flex flex-wrap gap-2">
              {courier.serviceAreas?.length ? (
                courier.serviceAreas.map(
                  (area, index) => (
                    <span
                      key={`${area}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {area}
                    </span>
                  )
                )
              ) : (
                <span className="text-sm text-slate-400">
                  No service areas configured
                </span>
              )}
            </div>
          </section>

          {/* ADMIN NOTE */}
          {courier.adminNote && (
            <section>
              <SectionTitle icon={<ShieldAlert size={15} />}>
                Admin Note
              </SectionTitle>

              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {courier.adminNote}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================
   DOCUMENT CARD
===================================== */

function DocumentCard({
  title,
  document,
}) {
  const verified = Boolean(document?.verified);
  const url = document?.documentUrl;
  const number = document?.documentNumber || "";
  const maskedNumber =
    number.length > 4
      ? `${"*".repeat(number.length - 4)}${number.slice(-4)}`
      : number;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {url
              ? "Document uploaded"
              : "Document not uploaded"}
          </p>
          {maskedNumber && (
            <p className="mt-1 text-xs font-semibold text-slate-600">
              No: {maskedNumber}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
            verified
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {verified ? "Verified" : "Not Verified"}
        </span>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-slate-50"
        >
          <ExternalLink size={14} />
          View Document
        </a>
      )}
    </div>
  );
}

/* =====================================
   SECTION TITLE
===================================== */

function SectionTitle({
  icon,
  children,
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
      {icon}
      {children}
    </h3>
  );
}

/* =====================================
   INFO
===================================== */

function Info({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* =====================================
   AVATAR
===================================== */

function CourierAvatar({
  courier,
  size = "sm",
}) {
  const sizeClass =
    size === "md"
      ? "h-14 w-14"
      : "h-10 w-10";

  const photo =
    courier?.photo || "";

  return photo ? (
    <img
      src={photo}
      alt=""
      className={`${sizeClass} shrink-0 rounded-xl border border-slate-200 object-cover bg-white`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700`}
    >
      <Truck
        size={size === "md" ? 24 : 18}
      />
    </div>
  );
}

/* =====================================
   MAIN COMPONENT
===================================== */

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [verifying, setVerifying] =
    useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [verificationFilter, setVerificationFilter] =
    useState("all");

  const [formOpen, setFormOpen] =
    useState(false);
  const [formMode, setFormMode] =
    useState("create");
  const [editingId, setEditingId] =
    useState(null);
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [detailsCourier, setDetailsCourier] =
    useState(null);

  /* =====================================
     LOAD COURIERS
  ===================================== */

  const loadCouriers = async ({
    silent = false,
  } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await adminApi.get(COURIER_BASE);

      const data = response?.data;

      const list = Array.isArray(
        data?.couriers
      )
        ? data.couriers
        : Array.isArray(data)
          ? data
          : [];

      const normalized = list
        .map(normalizeCourier)
        .filter((courier) =>
          isValidObjectId(
            courier._id
          )
        );

      setCouriers(normalized);
    } catch (error) {
      console.error(
        "Load couriers error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to load couriers"
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  /* =====================================
     FILTER
  ===================================== */

  const filteredCouriers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return couriers.filter((courier) => {
      const matchesSearch =
        !query ||
        String(
          courier.name || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          courier.phone || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          courier.vehicleNumber || ""
        )
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        courier.status === statusFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        courier.verificationStatus ===
          verificationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVerification
      );
    });
  }, [
    couriers,
    search,
    statusFilter,
    verificationFilter,
  ]);

  /* =====================================
     STATS
  ===================================== */

  const stats = useMemo(() => {
    return {
      total: couriers.length,
      available: couriers.filter(
        (c) => c.status === "available"
      ).length,
      busy: couriers.filter(
        (c) => c.status === "busy"
      ).length,
      pending: couriers.filter(
        (c) =>
          c.verificationStatus ===
            "pending" ||
          c.verificationStatus ===
            "under_review"
      ).length,
      verified: couriers.filter(
        (c) =>
          c.verificationStatus ===
          "verified"
      ).length,
      rejected: couriers.filter(
        (c) =>
          c.verificationStatus ===
          "rejected"
      ).length,
    };
  }, [couriers]);

  /* =====================================
     CREATE
  ===================================== */

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
    });
    setFormOpen(true);
  };

  /* =====================================
     EDIT
  ===================================== */

  const openEdit = (courier) => {
    const id = getCourierId(courier);

    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID. Cannot edit this courier."
      );
      return;
    }

    setFormMode("edit");
    setEditingId(id);

    setForm({
      ...EMPTY_FORM,
      ...courier,
      serviceAreas:
        Array.isArray(
          courier.serviceAreas
        )
          ? courier.serviceAreas.join(", ")
          : "",
      estimatedDeliveryMinutes:
        courier.estimatedDeliveryMinutes ??
        30,
      aadhaarNumber:
        courier.documents?.aadhaar?.documentNumber || "",
      drivingLicenseNumber:
        courier.documents?.drivingLicense?.documentNumber || "",
      photoFile: null,
      aadhaarFile: null,
      drivingLicenseFile: null,
    });

    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
    });
  };

  /* =====================================
     PAYLOAD
  ===================================== */

  const buildPayload = () => {
    const data = new FormData();

    const append = (key, value) => {
      if (value !== undefined && value !== null && value !== "") {
        data.append(key, String(value));
      }
    };

    append("name", form.name.trim());
    append("phone", form.phone.trim());
    append("vehicleType", form.vehicleType);
    append(
      "vehicleNumber",
      form.vehicleNumber.trim().toUpperCase()
    );
    append(
      "estimatedDeliveryMinutes",
      Number(form.estimatedDeliveryMinutes)
    );
    append("status", form.status);
    append("isActive", Boolean(form.isActive));
    append(
      "showPhoneToCustomer",
      Boolean(form.showPhoneToCustomer)
    );
    append(
      "isLocationSharing",
      Boolean(form.isLocationSharing)
    );
    append("adminNote", form.adminNote.trim());

    const serviceAreas = Array.isArray(form.serviceAreas)
      ? form.serviceAreas
      : String(form.serviceAreas || "")
          .split(",")
          .map((area) => area.trim())
          .filter(Boolean);

    serviceAreas.forEach((area) => {
      const trimmedArea = String(area || "").trim();
      if (trimmedArea) {
        data.append("serviceAreas", trimmedArea);
      }
    });

    if (form.photoFile instanceof File) {
      data.append("photo", form.photoFile);
    } else if (form.photo.trim()) {
      append("photo", form.photo.trim());
    }

    append("aadhaarNumber", form.aadhaarNumber.trim());

    if (form.aadhaarFile instanceof File) {
      data.append("aadhaar", form.aadhaarFile);
    }

    // Cycle: never send Driving Licence data.
    if (form.vehicleType !== "Cycle") {
      append(
        "drivingLicenseNumber",
        form.drivingLicenseNumber.trim().toUpperCase()
      );

      if (form.drivingLicenseFile instanceof File) {
        data.append(
          "drivingLicense",
          form.drivingLicenseFile
        );
      }
    }

    return data;
  };
  /* =====================================
     SAVE
  ===================================== */

 const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Build ONE multipart/form-data payload.
      // serviceAreas is stored in state as a comma-separated string,
      // so buildPayload() converts it into repeated serviceAreas fields.
      const formData = buildPayload();

      console.log(
        "========== FRONTEND FORM DATA =========="
      );

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`[COURIER FRONTEND] FILE ${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size,
          });
        } else {
          console.log(`[COURIER FRONTEND] ${key}:`, value);
        }
      }

      console.log(
        "[COURIER FRONTEND] FormData ready:",
        {
          isFormData: formData instanceof FormData,
          fieldCount: Array.from(formData.keys()).length,
          editingId,
        }
      );

      console.log(
        "========================================"
      );

      let response;

      if (editingId) {
        response = await adminApi.put(
          `${COURIER_BASE}/${editingId}`,
          formData
        );
      } else {
        response = await adminApi.post(
          COURIER_BASE,
          formData
        );
      }

      console.log(
        "[COURIER FRONTEND] SAVE RESPONSE:",
        response.data
      );

      toast.success(
        editingId
          ? "Courier updated successfully"
          : "Courier added successfully"
      );

      closeForm();
      await loadCouriers({ silent: true });
    } catch (error) {
      console.error(
        "[COURIER FRONTEND] SAVE ERROR:",
        error
      );

      console.error(
        "[COURIER FRONTEND] STATUS:",
        error?.response?.status
      );

      console.error(
        "[COURIER FRONTEND] RESPONSE:",
        error?.response?.data
      );

      console.error(
        "[COURIER FRONTEND] HEADERS:",
        error?.response?.headers
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to save courier"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================
     VIEW DETAILS
  ===================================== */

  const viewCourier = async (
    courier
  ) => {
    const id = getCourierId(
      courier
    );

    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID"
      );
      return;
    }

    try {
      /*
        Fetch the individual courier.
        This fixes the common problem where a list item
        contains a wrong `id` field instead of MongoDB `_id`.
      */
      const response =
        await adminApi.get(
          `${COURIER_BASE}/${id}`
        );

      const fetched =
        response?.data?.courier ||
        response?.data;

      if (!fetched) {
        toast.error(
          "Courier not found"
        );
        return;
      }

      const normalized =
        normalizeCourier(
          fetched
        );

      const fetchedId =
        getCourierId(
          normalized
        );

      if (
        fetchedId &&
        fetchedId !== id
      ) {
        console.warn(
          "Courier ID changed between list and details:",
          {
            requested: id,
            received: fetchedId,
          }
        );
      }

      setDetailsCourier(
        normalized
      );
    } catch (error) {
      console.error(
        "Get courier details error:",
        error
      );

      const message =
        getErrorMessage(
          error,
          "Failed to get courier details"
        );

      toast.error(message);
    }
  };

  /* =====================================
     DISABLE
  ===================================== */

  const disableCourier = async (
    courier
  ) => {
    const id =
      getCourierId(courier);

    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Disable ${courier.name}?`
      );

    if (!confirmed) return;

    try {
      await adminApi.delete(
        `${COURIER_BASE}/${id}`
      );

      setCouriers((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                isActive: false,
                status:
                  item.status ===
                  "busy"
                    ? "busy"
                    : "offline",
              }
            : item
        )
      );

      toast.success(
        `${courier.name} disabled`
      );
    } catch (error) {
      console.error(
        "Disable courier error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to disable courier"
        )
      );
    }
  };

  /* =====================================
     ENABLE
  ===================================== */

  const enableCourier = async (
    courier
  ) => {
    const id =
      getCourierId(courier);

    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID"
      );
      return;
    }

    try {
      const response =
        await adminApi.put(
          `${COURIER_BASE}/${id}/enable`
        );

      const updated =
        response?.data?.courier;

      setCouriers((prev) =>
        prev.map((item) =>
          item._id === id
            ? normalizeCourier(
                updated || {
                  ...item,
                  isActive: true,
                }
              )
            : item
        )
      );

      toast.success(
        `${courier.name} enabled`
      );
    } catch (error) {
      console.error(
        "Enable courier error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to enable courier"
        )
      );
    }
  };

  /* =====================================
     VERIFY COURIER
  ===================================== */

  const verifyCourier = async (
    id
  ) => {
    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID"
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Verify this courier? Make sure Aadhaar and Driving Licence have been checked."
      );

    if (!confirmed) return;

    try {
      setVerifying(true);

      const response =
        await adminApi.put(
          `${COURIER_BASE}/${id}/verify`,
          {}
        );

      const updated =
        response?.data?.courier;

      if (updated) {
        const normalized =
          normalizeCourier(
            updated
          );

        setCouriers((prev) =>
          prev.map((item) =>
            item._id === id
              ? normalized
              : item
          )
        );

        setDetailsCourier(
          normalized
        );
      } else {
        await loadCouriers({
          silent: true,
        });
      }

      toast.success(
        "Courier verified successfully"
      );
    } catch (error) {
      console.error(
        "Verify courier error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to verify courier"
        )
      );
    } finally {
      setVerifying(false);
    }
  };

  /* =====================================
     REJECT COURIER
  ===================================== */

  const rejectCourier = async (
    id
  ) => {
    if (!isValidObjectId(id)) {
      toast.error(
        "Invalid courier ID"
      );
      return;
    }

    const reason =
      window.prompt(
        "Enter rejection reason:"
      );

    if (!reason?.trim()) {
      toast.error(
        "Rejection reason is required"
      );
      return;
    }

    try {
      setVerifying(true);

      const response =
        await adminApi.put(
          `${COURIER_BASE}/${id}/reject`,
          {
            rejectionReason:
              reason.trim(),
          }
        );

      const updated =
        response?.data?.courier;

      if (updated) {
        const normalized =
          normalizeCourier(
            updated
          );

        setCouriers((prev) =>
          prev.map((item) =>
            item._id === id
              ? normalized
              : item
          )
        );

        setDetailsCourier(
          normalized
        );
      } else {
        await loadCouriers({
          silent: true,
        });
      }

      toast.success(
        "Courier rejected"
      );
    } catch (error) {
      console.error(
        "Reject courier error:",
        error
      );

      toast.error(
        getErrorMessage(
          error,
          "Failed to reject courier"
        )
      );
    } finally {
      setVerifying(false);
    }
  };

  /* =====================================
     RENDER
  ===================================== */

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                <Truck size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Couriers
                </h1>

                <p className="text-sm text-slate-500">
                  Manage delivery people, KYC verification and live delivery status.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                loadCouriers({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Add Courier
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Total"
            value={stats.total}
            icon={<Truck size={18} />}
          />

          <Stat
            label="Available"
            value={stats.available}
            icon={<CheckCircle2 size={18} />}
          />

          <Stat
            label="Busy"
            value={stats.busy}
            icon={<Truck size={18} />}
          />

          <Stat
            label="Pending KYC"
            value={stats.pending}
            icon={<ShieldAlert size={18} />}
          />

          <Stat
            label="Verified"
            value={stats.verified}
            icon={<ShieldCheck size={18} />}
          />

          <Stat
            label="Rejected"
            value={stats.rejected}
            icon={<XCircle size={18} />}
          />
        </div>

        {/* FILTERS */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, phone or vehicle number..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-black"
          >
            <option value="all">
              All Courier Status
            </option>

            {COURIER_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {statusLabel(status)}
                </option>
              )
            )}
          </select>

          <select
            value={verificationFilter}
            onChange={(e) =>
              setVerificationFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-black"
          >
            <option value="all">
              All Verification
            </option>

            {VERIFICATION_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {verificationLabel(
                    status
                  )}
                </option>
              )
            )}
          </select>
        </div>

        {/* CONTENT */}
        {loading ? (
          <LoadingState />
        ) : filteredCouriers.length === 0 ? (
          <EmptyState
            onAdd={openCreate}
          />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-[11px] font-black uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-4">
                        Courier
                      </th>

                      <th className="px-5 py-4">
                        Vehicle
                      </th>

                      <th className="px-5 py-4">
                        KYC
                      </th>

                      <th className="px-5 py-4">
                        Delivery
                      </th>

                      <th className="px-5 py-4">
                        Performance
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCouriers.map(
                      (courier) => (
                        <CourierRow
                          key={
                            courier._id
                          }
                          courier={
                            courier
                          }
                          onView={() =>
                            viewCourier(
                              courier
                            )
                          }
                          onEdit={() =>
                            openEdit(
                              courier
                            )
                          }
                          onDisable={() =>
                            disableCourier(
                              courier
                            )
                          }
                          onEnable={() =>
                            enableCourier(
                              courier
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}
            <div className="grid gap-3 lg:hidden">
              {filteredCouriers.map(
                (courier) => (
                  <CourierCard
                    key={
                      courier._id
                    }
                    courier={courier}
                    onView={() =>
                      viewCourier(
                        courier
                      )
                    }
                    onEdit={() =>
                      openEdit(
                        courier
                      )
                    }
                    onDisable={() =>
                      disableCourier(
                        courier
                      )
                    }
                    onEnable={() =>
                      enableCourier(
                        courier
                      )
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </div>

      <CourierFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        saving={saving}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <CourierDetailsModal
        courier={detailsCourier}
        verifying={verifying}
        onVerify={verifyCourier}
        onReject={rejectCourier}
        onClose={() =>
          setDetailsCourier(null)
        }
      />
    </div>
  );
}

/* =====================================
   STAT
===================================== */

function Stat({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">
          {label}
        </span>

        <span className="text-slate-400">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

/* =====================================
   DESKTOP ROW
===================================== */

function CourierRow({
  courier,
  onView,
  onEdit,
  onDisable,
  onEnable,
}) {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <CourierAvatar
            courier={courier}
          />

          <div className="min-w-0">
            <p className="font-bold text-slate-900">
              {courier.name}
            </p>

            <p className="text-xs text-slate-400">
              {courier.phone ||
                "No phone"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-300">
              {courier._id}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-800">
          {courier.vehicleType ||
            "—"}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {courier.vehicleNumber ||
            "No vehicle number"}
        </p>
      </td>

      <td className="px-5 py-4">
        <VerificationBadge
          status={
            courier.verificationStatus
          }
        />
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-800">
          {courier.estimatedDeliveryMinutes ??
            "—"}{" "}
          min
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-bold text-slate-800">
          {courier.successfulDeliveries ??
            0}{" "}
          /{" "}
          {courier.totalDeliveries ??
            0}
        </p>

        <p className="text-xs text-slate-400">
          Rating{" "}
          {courier.rating ??
            0}{" "}
          / 5
        </p>
      </td>

      <td className="px-5 py-4">
        <CourierStatusBadge
          status={courier.status}
          active={courier.isActive}
        />
      </td>

      <td className="px-5 py-4">
        <ActionButtons
          courier={courier}
          onView={onView}
          onEdit={onEdit}
          onDisable={onDisable}
          onEnable={onEnable}
        />
      </td>
    </tr>
  );
}

/* =====================================
   MOBILE CARD
===================================== */

function CourierCard({
  courier,
  onView,
  onEdit,
  onDisable,
  onEnable,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CourierAvatar
            courier={courier}
          />

          <div className="min-w-0">
            <p className="truncate font-black text-slate-900">
              {courier.name}
            </p>

            <p className="text-xs text-slate-400">
              {courier.phone ||
                "No phone"}
            </p>
          </div>
        </div>

        <CourierStatusBadge
          status={courier.status}
          active={courier.isActive}
        />
      </div>

      <div className="mt-3">
        <VerificationBadge
          status={
            courier.verificationStatus
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Info
          label="Vehicle"
          value={
            courier.vehicleType ||
            "—"
          }
        />

        <Info
          label="Vehicle No."
          value={
            courier.vehicleNumber ||
            "—"
          }
        />

        <Info
          label="Delivery"
          value={`${courier.estimatedDeliveryMinutes ?? "—"} min`}
        />

        <Info
          label="Rating"
          value={`${courier.rating ?? 0} / 5`}
        />

        <Info
          label="Deliveries"
          value={
            courier.successfulDeliveries ??
            0
          }
        />

        <Info
          label="Location"
          value={
            courier.isLocationSharing
              ? "Sharing"
              : "Off"
          }
        />
      </div>

      <div className="mt-4 border-t pt-3">
        <ActionButtons
          courier={courier}
          onView={onView}
          onEdit={onEdit}
          onDisable={onDisable}
          onEnable={onEnable}
          mobile
        />
      </div>
    </div>
  );
}

/* =====================================
   ACTION BUTTONS
===================================== */

function ActionButtons({
  courier,
  onView,
  onEdit,
  onDisable,
  onEnable,
  mobile = false,
}) {
  return (
    <div
      className={`flex ${
        mobile
          ? "w-full"
          : "justify-end"
      } gap-1.5`}
    >
      <IconButton
        label="View"
        onClick={onView}
      >
        <Eye size={16} />
      </IconButton>

      <IconButton
        label="Edit"
        onClick={onEdit}
      >
        <Pencil size={16} />
      </IconButton>

      {courier.isActive ? (
        <IconButton
          label="Disable"
          danger
          onClick={onDisable}
        >
          <Trash2 size={16} />
        </IconButton>
      ) : (
        <IconButton
          label="Enable"
          onClick={onEnable}
        >
          <CheckCircle2 size={16} />
        </IconButton>
      )}
    </div>
  );
}

/* =====================================
   ICON BUTTON
===================================== */

function IconButton({
  children,
  onClick,
  label,
  danger = false,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg border p-2 transition ${
        danger
          ? "border-red-100 text-red-600 hover:bg-red-50"
          : "border-slate-200 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

/* =====================================
   VERIFICATION BADGE
===================================== */

function VerificationBadge({
  status,
}) {
  const config = {
    verified: {
      text: "Verified",
      className:
        "bg-emerald-50 text-emerald-700",
      icon: (
        <CheckCircle2 size={12} />
      ),
    },

    under_review: {
      text: "Under Review",
      className:
        "bg-blue-50 text-blue-700",
      icon: (
        <RefreshCw size={12} />
      ),
    },

    rejected: {
      text: "Rejected",
      className:
        "bg-red-50 text-red-700",
      icon: (
        <XCircle size={12} />
      ),
    },

    pending: {
      text: "Pending",
      className:
        "bg-amber-50 text-amber-700",
      icon: (
        <ShieldAlert size={12} />
      ),
    },
  };

  const item =
    config[status] ||
    config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${item.className}`}
    >
      {item.icon}
      {item.text}
    </span>
  );
}

/* =====================================
   COURIER STATUS BADGE
===================================== */

function CourierStatusBadge({
  status,
  active,
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">
        <Ban size={11} />
        Disabled
      </span>
    );
  }

  const config = {
    available:
      "bg-emerald-50 text-emerald-700",
    busy:
      "bg-blue-50 text-blue-700",
    offline:
      "bg-slate-100 text-slate-600",
    suspended:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
        config[status] ||
        config.offline
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

/* =====================================
   LOADING
===================================== */

function LoadingState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
      <RefreshCw
        className="mx-auto animate-spin text-slate-400"
        size={28}
      />

      <p className="mt-3 text-sm font-semibold text-slate-500">
        Loading couriers...
      </p>
    </div>
  );
}

/* =====================================
   EMPTY
===================================== */

function EmptyState({
  onAdd,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Truck
          size={25}
          className="text-slate-500"
        />
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        No couriers found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Add a delivery person to start assigning couriers to Odikart orders.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white"
      >
        <Plus size={17} />
        Add Courier
      </button>
    </div>
  );
}
