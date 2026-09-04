import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Ban,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Save,
  Truck,
  Globe2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Layers3,
  Package,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import toast from "react-hot-toast";

import adminApi from "../../services/adminApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = [
  {
    value: "all",
    label: "All Products",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "blocked",
    label: "Blocked",
  },
  {
    value: "draft",
    label: "Draft",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const money = (value, currency = "INR") => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const shortId = (id) => {
  if (!id) return "—";

  return `${String(id).slice(0, 6)}...${String(id).slice(-4)}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return "—";
  }
};

const getProductTitle = (product) => {
  return product?.title || "Untitled Product";
};

const getProductBrand = (product) => {
  return product?.brand || "No brand";
};

const getCategoryName = (product) => {
  if (!product?.category) return "Uncategorized";

  if (typeof product.category === "string") {
    return product.category;
  }

  return product.category.name || "Uncategorized";
};

const getSubCategoryName = (product) => {
  if (!product?.subCategory) return "";

  if (typeof product.subCategory === "string") {
    return product.subCategory;
  }

  return product.subCategory.name || "";
};

const getSellerName = (product) => {
  const seller = product?.seller;

  if (!seller) return "Unknown seller";

  const fullName = [
    seller.firstName,
    seller.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    seller.name ||
    seller.email ||
    "Unknown seller"
  );
};

const getSellerEmail = (product) => {
  return product?.seller?.email || "No email";
};

const getStoreName = (product) => {
  return (
    product?.seller?.sellerInfo?.store?.shopName ||
    product?.seller?.store?.shopName ||
    "No store name"
  );
};

const getVariants = (product) => {
  return Array.isArray(product?.variants)
    ? product.variants
    : [];
};

const getTotalStock = (product) => {
  return getVariants(product).reduce(
    (total, variant) =>
      total + Number(variant?.stock || 0),
    0
  );
};

const getTotalSold = (product) => {
  return getVariants(product).reduce(
    (total, variant) =>
      total + Number(variant?.sold || 0),
    0
  );
};

const getActiveVariants = (product) => {
  return getVariants(product).filter(
    (variant) => variant?.isActive !== false
  );
};

const getPrices = (product) => {
  return getVariants(product)
    .map((variant) => Number(variant?.price || 0))
    .filter((price) => price >= 0);
};

const getPriceRange = (product) => {
  const prices = getPrices(product);

  if (!prices.length) {
    return money(0);
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return money(min, product?.currency || "INR");
  }

  return `${money(
    min,
    product?.currency || "INR"
  )} – ${money(
    max,
    product?.currency || "INR"
  )}`;
};

const getProductImages = (product) => {
  const mediaImages = Array.isArray(
    product?.media?.images
  )
    ? product.media.images
    : [];

  if (mediaImages.length) {
    return mediaImages;
  }

  const variantImages = getVariants(product).flatMap(
    (variant) =>
      Array.isArray(variant?.images)
        ? variant.images
        : []
  );

  return variantImages;
};

const getThumbnail = (product) => {
  return (
    product?.media?.thumbnail ||
    getProductImages(product)[0] ||
    ""
  );
};

const getVariantAttributes = (variant) => {
  if (!variant?.attributes) {
    return "";
  }

  if (
    typeof variant.attributes === "object" &&
    !Array.isArray(variant.attributes)
  ) {
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" • ");
  }

  return "";
};

const getDiscount = (product) => {
  const variants = getVariants(product);

  if (!variants.length) return 0;

  const discounts = variants
    .map((variant) =>
      Number(
        variant?.discountPercentage || 0
      )
    )
    .filter((value) => value > 0);

  if (!discounts.length) {
    return Number(product?.offer?.value || 0);
  }

  return Math.max(...discounts);
};

const getTotalRevenue = (product) => {
  return Number(
    product?.analytics?.revenue || 0
  );
};

const getViews = (product) => {
  return Number(
    product?.analytics?.views || 0
  );
};

const getWishlist = (product) => {
  return Number(
    product?.analytics?.wishlist || 0
  );
};

const getCart = (product) => {
  return Number(
    product?.analytics?.cart || 0
  );
};

const getOrders = (product) => {
  return Number(
    product?.analytics?.orders || 0
  );
};

const getSales = (product) => {
  return Number(
    product?.analytics?.sales || 0
  );
};

const getTrendingScore = (product) => {
  return Number(
    product?.analytics?.trendingScore || 0
  );
};

const getPopularityScore = (product) => {
  return Number(
    product?.analytics?.popularityScore || 0
  );
};

const getConversionRate = (product) => {
  return Number(
    product?.analytics?.conversionRate || 0
  );
};

const getStatusStyles = (status) => {
  switch (status) {
    case "approved":
      return "bg-black text-white border-black";

    case "pending":
      return "bg-white text-black border-black";

    case "rejected":
      return "bg-neutral-200 text-black border-neutral-300";

    case "blocked":
      return "bg-black text-white border-black";

    case "draft":
      return "bg-neutral-100 text-neutral-600 border-neutral-300";

    case "suspended":
      return "bg-neutral-300 text-black border-neutral-400";

    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
};

const getFlagBadges = (product) => {
  const badges = [];

  if (product?.featured) {
    badges.push({
      label: "Featured",
      icon: Star,
    });
  }

  if (product?.trending) {
    badges.push({
      label: "Trending",
      icon: TrendingUp,
    });
  }

  if (product?.bestSeller) {
    badges.push({
      label: "Best Seller",
      icon: CheckCircle2,
    });
  }

  if (product?.isNewArrival) {
    badges.push({
      label: "New",
      icon: Sparkles,
    });
  }

  if (product?.isFlashSale) {
    badges.push({
      label: "Flash Sale",
      icon: Zap,
    });
  }

  if (product?.isDealOfTheDay) {
    badges.push({
      label: "Deal",
      icon: Tag,
    });
  }

  if (product?.isRecommended) {
    badges.push({
      label: "Recommended",
      icon: Check,
    });
  }

  if (product?.isPopular) {
    badges.push({
      label: "Popular",
      icon: TrendingUp,
    });
  }

  if (product?.isLowStock) {
    badges.push({
      label: "Low Stock",
      icon: AlertTriangle,
    });
  }

  if (product?.isAlmostSoldOut) {
    badges.push({
      label: "Almost Sold",
      icon: AlertTriangle,
    });
  }

  return badges;
};

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${getStatusStyles(
        status
      )}`}
    >
      {status || "unknown"}
    </span>
  );
};

const Metric = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </span>

        <div className="rounded-lg bg-black p-2 text-white">
          <Icon size={14} />
        </div>
      </div>

      <p className="text-xl font-bold tracking-tight text-black">
        {value}
      </p>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <span className="text-xs font-semibold text-neutral-400">
        {label}
      </span>

      <span className="break-words text-sm font-medium text-black sm:max-w-[65%] sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  children,
}) => {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4 sm:px-5">
        <div className="rounded-lg bg-black p-2 text-white">
          <Icon size={16} />
        </div>

        <h3 className="text-sm font-bold">
          {title}
        </h3>
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
        active
          ? "border-black bg-black text-white shadow-lg"
          : "border-neutral-200 bg-white text-black hover:border-black hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              active
                ? "text-neutral-400"
                : "text-neutral-400"
            }`}
          >
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 transition ${
            active
              ? "bg-white text-black"
              : "bg-black text-white group-hover:scale-105"
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
};

/* =========================================================
   PRODUCT IMAGE
========================================================= */

const ProductImage = ({
  product,
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  const image = getThumbnail(product);

  if (!image || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 text-neutral-400 ${className}`}
      >
        <Package size={28} />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={getProductTitle(product)}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};

/* =========================================================
   FLAG BADGES
========================================================= */

const ProductFlags = ({ product }) => {
  const flags = getFlagBadges(product);

  if (!flags.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.slice(0, 4).map((flag) => {
        const Icon = flag.icon;

        return (
          <span
            key={flag.label}
            className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-700"
          >
            <Icon size={10} />

            {flag.label}
          </span>
        );
      })}

      {flags.length > 4 && (
        <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">
          +{flags.length - 4}
        </span>
      )}
    </div>
  );
};

/* =========================================================
   VARIANTS
========================================================= */

const VariantsTable = ({ product }) => {
  const variants = getVariants(product);

  if (!variants.length) {
    return (
      <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
        No variants available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                SKU
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Variant
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Price
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Original
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Discount
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Stock
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Sold
              </th>

              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant, index) => (
              <tr
                key={
                  variant?._id ||
                  variant?.sku ||
                  index
                }
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-4">
                  <span className="font-mono text-xs font-semibold">
                    {variant?.sku || "—"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <p className="text-sm font-medium">
                    {getVariantAttributes(
                      variant
                    ) || `Variant ${index + 1}`}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm font-bold">
                    {money(
                      variant?.price,
                      product?.currency || "INR"
                    )}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm text-neutral-500 line-through">
                    {money(
                      variant?.originalPrice,
                      product?.currency || "INR"
                    )}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="text-xs font-bold">{variant?.gstRate ?? variant?.tax ?? 0}% GST</div>
                  <div className="mt-1 text-[10px] text-neutral-400">HSN {variant?.hsnCode || "—"}</div>
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold">
                    {variant?.discountPercentage || 0}%
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`text-sm font-bold ${
                      Number(variant?.stock || 0) <= 5
                        ? "text-black"
                        : "text-neutral-700"
                    }`}
                  >
                    {variant?.stock || 0}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm font-semibold">
                    {variant?.sold || 0}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      variant?.isActive === false
                        ? "bg-neutral-200 text-neutral-500"
                        : "bg-black text-white"
                    }`}
                  >
                    {variant?.isActive === false
                      ? "Inactive"
                      : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================================
   GALLERY
========================================================= */

const ProductGallery = ({ product }) => {
  const images = getProductImages(product);

  const [selected, setSelected] =
    useState(0);

  useEffect(() => {
    setSelected(0);
  }, [product?._id]);

  const currentImage =
    images[selected] || "";

  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
        {currentImage ? (
          <img
            src={currentImage}
            alt={getProductTitle(product)}
            className="h-full w-full object-contain p-4 sm:p-8"
          />
        ) : (
          <div className="text-neutral-400">
            <ImageIcon size={70} />
          </div>
        )}

        {product?.offer?.enabled && (
          <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
            {product?.offer?.label ||
              `${product?.offer?.value || 0}% OFF`}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.slice(0, 8).map(
            (image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() =>
                  setSelected(index)
                }
                className={`aspect-square overflow-hidden rounded-xl border-2 bg-neutral-100 ${
                  selected === index
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   PRODUCT DETAIL DRAWER
========================================================= */

const ProductDetail = ({
  product,
  onClose,
  onApprove,
  onReject,
  onBlock,
  onEdit,
  actionLoading,
}) => {
  if (!product) return null;

  const flags = getFlagBadges(product);

  return (
    <div className="fixed inset-0 z-[90] bg-black/70">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl">
        {/* HEADER */}

        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Package
                size={18}
                className="shrink-0"
              />

              <p className="truncate text-sm font-bold">
                Product Details
              </p>
            </div>

            <p className="mt-1 truncate text-xs text-neutral-400">
              {shortId(product?._id)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 p-2.5 transition hover:border-black hover:bg-black hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* CONTENT */}

        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="mx-auto w-full max-w-6xl space-y-4 p-4 sm:p-6">
            {/* HERO */}

            <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
                <ProductGallery product={product} />
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={product.status}
                    />

                    {product.productType && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold capitalize">
                        {product.productType}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      {getProductBrand(product)}
                    </p>

                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                      {getProductTitle(product)}
                    </h1>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-neutral-600">
                    {product.shortDescription ||
                      product.description ||
                      "No description available."}
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <span className="text-3xl font-black">
                      {getPriceRange(product)}
                    </span>

                    {getDiscount(product) > 0 && (
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                        <Percent size={11} />

                        {getDiscount(product)}% OFF
                      </span>
                    )}
                  </div>

                  <ProductFlags product={product} />

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Metric
                      label="Stock"
                      value={getTotalStock(
                        product
                      )}
                      icon={Boxes}
                    />

                    <Metric
                      label="Sold"
                      value={getTotalSold(
                        product
                      )}
                      icon={ShoppingCart}
                    />

                    <Metric
                      label="Views"
                      value={getViews(product)}
                      icon={Eye}
                    />

                    <Metric
                      label="Rating"
                      value={`${Number(
                        product?.rating || 0
                      ).toFixed(1)} / 5`}
                      icon={Star}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* VARIANTS */}

            <Section
              title="Variants & Inventory"
              icon={Layers3}
            >
              <VariantsTable
                product={product}
              />
            </Section>

            {/* PRODUCT INFORMATION */}

            <div className="grid gap-4 lg:grid-cols-2">
              <Section
                title="Product Information"
                icon={Info}
              >
                <InfoRow
                  label="Product ID"
                  value={product?._id}
                />

                <InfoRow
                  label="Slug"
                  value={product?.slug}
                />

                <InfoRow
                  label="Brand"
                  value={getProductBrand(product)}
                />

                <InfoRow
                  label="Category"
                  value={getCategoryName(product)}
                />

                <InfoRow
                  label="Subcategory"
                  value={
                    getSubCategoryName(product) ||
                    "—"
                  }
                />

                <InfoRow
                  label="Product Type"
                  value={product?.productType}
                />

                <InfoRow
                  label="Currency"
                  value={product?.currency}
                />

                <InfoRow
                  label="Min Order"
                  value={
                    product?.minimumOrderQuantity
                  }
                />

                <InfoRow
                  label="Max Order"
                  value={
                    product?.maximumOrderQuantity
                  }
                />
              </Section>

              <Section
                title="Seller"
                icon={Store}
              >
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-black p-4 text-white">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                    <User size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {getSellerName(product)}
                    </p>

                    <p className="truncate text-xs text-neutral-400">
                      {getSellerEmail(product)}
                    </p>
                  </div>
                </div>

                <InfoRow
                  label="Store"
                  value={getStoreName(product)}
                />

                <InfoRow
                  label="Seller ID"
                  value={
                    typeof product?.seller ===
                    "object"
                      ? product?.seller?._id
                      : product?.seller
                  }
                />

                <InfoRow
                  label="Seller Status"
                  value={
                    product?.seller?.sellerStatus ||
                    "—"
                  }
                />

                <InfoRow
                  label="Verification"
                  value={
                    product?.seller?.sellerInfo
                      ?.verification
                      ? "Available"
                      : "Not available"
                  }
                />
              </Section>
            </div>

            {/* DESCRIPTION */}

            <Section
              title="Description & Tags"
              icon={Tag}
            >
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Description
                </p>

                <p className="text-sm leading-7 text-neutral-700">
                  {product?.description ||
                    "No description."}
                </p>
              </div>

              {Array.isArray(product?.tags) &&
                product.tags.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Tags
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(
                        (tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </Section>

            {/* ANALYTICS */}

            <Section
              title="Product Analytics"
              icon={TrendingUp}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Metric
                  label="Views"
                  value={getViews(product)}
                  icon={Eye}
                />

                <Metric
                  label="Wishlist"
                  value={getWishlist(product)}
                  icon={Star}
                />

                <Metric
                  label="Cart"
                  value={getCart(product)}
                  icon={ShoppingCart}
                />

                <Metric
                  label="Orders"
                  value={getOrders(product)}
                  icon={Package}
                />

                <Metric
                  label="Sales"
                  value={getSales(product)}
                  icon={CheckCircle2}
                />

                <Metric
                  label="Revenue"
                  value={money(
                    getTotalRevenue(product)
                  )}
                  icon={TrendingUp}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Metric
                  label="Trending Score"
                  value={getTrendingScore(
                    product
                  )}
                  icon={TrendingUp}
                />

                <Metric
                  label="Popularity Score"
                  value={getPopularityScore(
                    product
                  )}
                  icon={Sparkles}
                />

                <Metric
                  label="Conversion"
                  value={`${getConversionRate(
                    product
                  )}%`}
                  icon={Percent}
                />
              </div>
            </Section>

            {/* OFFER */}

            <Section
              title="Offer"
              icon={Percent}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoRow
                  label="Enabled"
                  value={
                    product?.offer?.enabled
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoRow
                  label="Discount Type"
                  value={
                    product?.offer?.discountType
                  }
                />

                <InfoRow
                  label="Value"
                  value={
                    product?.offer?.value
                      ? `${product.offer.value}${
                          product.offer
                            .discountType ===
                          "percentage"
                            ? "%"
                            : ""
                        }`
                      : "0"
                  }
                />

                <InfoRow
                  label="Label"
                  value={
                    product?.offer?.label
                  }
                />
              </div>
            </Section>

            {/* SHIPPING */}

            <Section
              title="Shipping & Returns"
              icon={Package}
            >
              <div className="grid gap-x-6 sm:grid-cols-2">
                <InfoRow
                  label="Free Shipping"
                  value={
                    product?.shipping
                      ?.freeShipping
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoRow
                  label="Shipping Charge"
                  value={money(
                    product?.shipping
                      ?.shippingCharge
                  )}
                />

                <InfoRow
                  label="Processing Time"
                  value={
                    product?.shipping
                      ?.processingTime
                      ? `${product.shipping.processingTime} days`
                      : "—"
                  }
                />

                <InfoRow
                  label="Return Days"
                  value={
                    product?.shipping
                      ?.returnDays
                      ? `${product.shipping.returnDays} days`
                      : "—"
                  }
                />

                <InfoRow
                  label="Material"
                  value={product?.material}
                />

                <InfoRow
                  label="Warranty"
                  value={
                    product?.warrantyInformation
                  }
                />

                <InfoRow
                  label="Return Policy"
                  value={product?.returnPolicy}
                />

                <InfoRow
                  label="Shipping Information"
                  value={
                    product?.shippingInformation
                  }
                />
              </div>

              {Array.isArray(
                product?.shipping
                  ?.serviceablePincodes
              ) &&
                product.shipping
                  .serviceablePincodes.length >
                  0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Serviceable Pincodes
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {product.shipping.serviceablePincodes.map(
                        (pin) => (
                          <span
                            key={pin}
                            className="rounded-lg bg-neutral-100 px-3 py-1.5 font-mono text-xs font-semibold"
                          >
                            {pin}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </Section>

            {/* SEO */}

            <Section
              title="SEO"
              icon={ExternalLink}
            >
              <InfoRow
                label="Meta Title"
                value={
                  product?.seo?.metaTitle
                }
              />

              <InfoRow
                label="Meta Description"
                value={
                  product?.seo?.metaDescription
                }
              />

              <InfoRow
                label="Canonical URL"
                value={
                  product?.seo?.canonicalUrl
                }
              />

              <div className="border-b border-neutral-100 py-3">
                <p className="mb-2 text-xs font-semibold text-neutral-400">
                  Keywords
                </p>

                <div className="flex flex-wrap gap-2">
                  {(product?.seo?.keywords ||
                    []
                  ).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}

                  {!product?.seo?.keywords
                    ?.length && (
                    <span className="text-sm text-neutral-400">
                      No keywords
                    </span>
                  )}
                </div>
              </div>

              {product?.seo?.ogImage && (
                <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                  <img
                    src={product.seo.ogImage}
                    alt="SEO OG"
                    className="max-h-64 w-full object-cover"
                  />
                </div>
              )}
            </Section>

            {/* AI */}

            <Section
              title="AI Content"
              icon={Sparkles}
            >
              <InfoRow
                label="AI SEO Title"
                value={product?.ai?.seoTitle}
              />

              <InfoRow
                label="AI SEO Description"
                value={
                  product?.ai?.seoDescription
                }
              />

              <InfoRow
                label="AI Description"
                value={
                  product?.ai?.generatedDescription
                }
              />

              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-neutral-400">
                  AI Keywords
                </p>

                <div className="flex flex-wrap gap-2">
                  {(product?.ai?.keywords ||
                    []
                  ).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white"
                    >
                      {keyword}
                    </span>
                  ))}

                  {!product?.ai?.keywords
                    ?.length && (
                    <span className="text-sm text-neutral-400">
                      No AI keywords generated.
                    </span>
                  )}
                </div>
              </div>
            </Section>

            {/* APPROVAL HISTORY */}

            <Section
              title="Approval History"
              icon={ShieldCheck}
            >
              {Array.isArray(
                product?.approvalHistory
              ) &&
              product.approvalHistory.length > 0 ? (
                <div className="space-y-4">
                  {[
                    ...product.approvalHistory,
                  ]
                    .reverse()
                    .map((item, index) => (
                      <div
                        key={
                          item?._id ||
                          `${item?.action}-${index}`
                        }
                        className="relative flex gap-3"
                      >
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
                            {item?.action ===
                            "approved" ? (
                              <Check size={14} />
                            ) : item?.action ===
                              "rejected" ? (
                              <X size={14} />
                            ) : (
                              <Clock3
                                size={14}
                              />
                            )}
                          </div>

                          {index !==
                            product
                              .approvalHistory
                              .length -
                              1 && (
                            <div className="absolute top-8 h-full w-px bg-neutral-200" />
                          )}
                        </div>

                        <div className="pb-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold capitalize">
                              {item?.action ||
                                "Action"}
                            </p>

                            <span className="text-xs text-neutral-400">
                              {formatDate(
                                item?.date
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-neutral-600">
                            {item?.reason ||
                              "No reason provided."}
                          </p>

                          {item?.performedBy && (
                            <p className="mt-1 font-mono text-[11px] text-neutral-400">
                              Admin:{" "}
                              {shortId(
                                item.performedBy
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  No approval history available.
                </p>
              )}
            </Section>

            {/* DATES */}

            <Section
              title="System Information"
              icon={Info}
            >
              <InfoRow
                label="Created At"
                value={formatDate(
                  product?.createdAt
                )}
              />

              <InfoRow
                label="Updated At"
                value={formatDate(
                  product?.updatedAt
                )}
              />

              <InfoRow
                label="Approved At"
                value={formatDate(
                  product?.approvedAt
                )}
              />

              <InfoRow
                label="Active"
                value={
                  product?.isActive
                    ? "Yes"
                    : "No"
                }
              />

              <InfoRow
                label="Deleted"
                value={
                  product?.isDeleted
                    ? "Yes"
                    : "No"
                }
              />
            </Section>
          </div>
        </main>

        {/* ACTION BAR */}

        <footer className="shrink-0 border-t border-neutral-200 bg-white p-3 sm:p-4">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:justify-end">
            {product.status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    product._id
                  }
                  onClick={() =>
                    onReject(product)
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black px-5 text-sm font-bold transition hover:bg-black hover:text-white disabled:opacity-40"
                >
                  <XCircle size={16} />
                  Reject
                </button>

                <button
                  type="button"
                  disabled={
                    actionLoading ===
                    product._id
                  }
                  onClick={() =>
                    onApprove(product)
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
              </>
            )}

            {product.status === "approved" && (
              <button
                type="button"
                disabled={
                  actionLoading ===
                  product._id
                }
                onClick={() =>
                  onBlock(product)
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black px-5 text-sm font-bold transition hover:bg-black hover:text-white disabled:opacity-40"
              >
                <Ban size={16} />
                Block Product
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(product)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-black px-5 text-sm font-bold transition hover:bg-black hover:text-white"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

/* =========================================================
   REASON MODAL
========================================================= */

const ReasonModal = ({
  type,
  product,
  reason,
  setReason,
  onClose,
  onSubmit,
  loading,
}) => {
  if (!product) return null;

  const isReject = type === "reject";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-200 p-5">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              {isReject ? (
                <XCircle size={18} />
              ) : (
                <Ban size={18} />
              )}
            </div>

            <h2 className="text-xl font-bold">
              {isReject
                ? "Reject Product"
                : "Block Product"}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              This action will change the product
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 transition hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 rounded-2xl bg-neutral-100 p-3">
            <p className="text-xs text-neutral-400">
              Product
            </p>

            <p className="mt-1 line-clamp-2 text-sm font-bold">
              {getProductTitle(product)}
            </p>
          </div>

          <label className="mb-2 block text-sm font-bold">
            Reason
          </label>

          <textarea
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            rows={5}
            placeholder={
              isReject
                ? "Enter the reason for rejecting this product..."
                : "Enter the reason for blocking this product..."
            }
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm outline-none transition focus:border-black focus:bg-white"
          />

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-bold transition hover:border-black"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                !reason.trim() || loading
              }
              onClick={onSubmit}
              className="h-11 flex-1 rounded-xl bg-black text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {loading
                ? "Processing..."
                : isReject
                ? "Reject Product"
                : "Block Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN PRODUCTS PAGE
========================================================= */

/* =========================================================
   PRODUCT CREATE / EDIT
   ---------------------------------------------------------
   Uses the fields accepted by createProduct/updateProduct.
   Create sends multipart/form-data because the backend accepts
   images[] and videos[].
========================================================= */

const EMPTY_VARIANT = {
  sku: "",
  originalPrice: "",
  price: "",
  hsnCode: "",
  gstRate: 18,
  taxInclusive: true,
  stock: 0,
  weight: 0,
  attributes: {},
  isActive: true,
};

const EMPTY_FORM = {
  title: "",
  description: "",
  shortDescription: "",
  category: "",
  subCategory: "",
  brand: "",
  productType: "simple",
  currency: "INR",
  minimumOrderQuantity: 1,
  maximumOrderQuantity: 10,
  tagsText: "",
  material: "",
  warrantyInformation: "",
  returnPolicy: "",
  shippingInformation: "",
  shipping: {
    freeShipping: false,
    shippingCharge: 0,
    processingTime: 3,
    returnDays: 7,
    serviceablePincodesText: "",
  },
  offer: {
    enabled: false,
    discountType: "percentage",
    value: 0,
    label: "",
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    keywordsText: "",
  },
  featured: false,
  trending: false,
  bestSeller: false,
  isNewArrival: false,
  isActive: true,
  variants: [{ ...EMPTY_VARIANT }],
};

const normalizeTree = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.categories)) return response.data.categories;
  return [];
};

const getTreeChildren = (item) =>
  item?.subCategories || item?.subcategories || item?.children || [];

const flattenParents = (tree) => tree.filter((item) => !item?.parentCategory);

const getCategoryId = (value) =>
  typeof value === "object" ? value?._id || "" : value || "";

const toEditorForm = (product) => {
  const shipping = product?.shipping || {};
  const offer = product?.offer || {};
  const seo = product?.seo || {};

  return {
    title: product?.title || "",
    description: product?.description || "",
    shortDescription: product?.shortDescription || "",
    category: getCategoryId(product?.category),
    subCategory: getCategoryId(product?.subCategory),
    brand: product?.brand || "",
    productType: product?.productType || "simple",
    currency: product?.currency || "INR",
    minimumOrderQuantity: Number(product?.minimumOrderQuantity || 1),
    maximumOrderQuantity: Number(product?.maximumOrderQuantity || 10),
    tagsText: Array.isArray(product?.tags) ? product.tags.join(", ") : "",
    material: product?.material || "",
    warrantyInformation: product?.warrantyInformation || "",
    returnPolicy: product?.returnPolicy || "",
    shippingInformation: product?.shippingInformation || "",
    shipping: {
      freeShipping: Boolean(shipping?.freeShipping),
      shippingCharge: Number(shipping?.shippingCharge || 0),
      processingTime: Number(shipping?.processingTime || 3),
      returnDays: Number(shipping?.returnDays || 7),
      serviceablePincodesText: Array.isArray(shipping?.serviceablePincodes)
        ? shipping.serviceablePincodes.join(", ")
        : "",
    },
    offer: {
      enabled: Boolean(offer?.enabled),
      discountType: offer?.discountType === "fixed" ? "fixed" : "percentage",
      value: Number(offer?.value || 0),
      label: offer?.label || "",
    },
    seo: {
      metaTitle: seo?.metaTitle || "",
      metaDescription: seo?.metaDescription || "",
      canonicalUrl: seo?.canonicalUrl || "",
      keywordsText: Array.isArray(seo?.keywords) ? seo.keywords.join(", ") : "",
    },
    featured: Boolean(product?.featured),
    trending: Boolean(product?.trending),
    bestSeller: Boolean(product?.bestSeller),
    isNewArrival: Boolean(product?.isNewArrival),
    isActive: product?.isActive !== false,
    variants:
      Array.isArray(product?.variants) && product.variants.length
        ? product.variants.map((variant) => ({
            sku: variant?.sku || "",
            originalPrice: Number(
              variant?.originalPrice ?? variant?.price ?? 0
            ),
            price: Number(variant?.price ?? variant?.originalPrice ?? 0),
            hsnCode: variant?.hsnCode || "",
            gstRate: Number(variant?.gstRate ?? variant?.tax ?? 18),
            taxInclusive: variant?.taxInclusive !== false,
            stock: Number(variant?.stock || 0),
            weight: Number(variant?.weight || 0),
            attributes:
              variant?.attributes &&
              typeof variant.attributes === "object" &&
              !Array.isArray(variant.attributes)
                ? variant.attributes
                : {},
            isActive: variant?.isActive !== false,
          }))
        : [{ ...EMPTY_VARIANT }],
  };
};

const parseList = (text) =>
  String(text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const Field = ({ label, required = false, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold text-neutral-700">
      {label} {required && <span className="text-black">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[10px] text-neutral-400">{hint}</span>}
  </label>
);

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const ProductEditor = ({
  open,
  editing,
  form,
  setForm,
  categories,
  imageFiles,
  setImageFiles,
  videoFiles,
  setVideoFiles,
  existingImages,
  onClose,
  onSubmit,
  submitting,
}) => {
  if (!open) return null;

  const parents = flattenParents(categories);

  const selectedParent = parents.find(
    (category) => String(category?._id) === String(form.category)
  );

  const subCategories = selectedParent ? getTreeChildren(selectedParent) : [];

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateNested = (group, key, value) =>
    setForm((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));

  const updateVariant = (index, key, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant
      ),
    }));
  };

  const updateAttribute = (index, key, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index
          ? {
              ...variant,
              attributes: {
                ...(variant.attributes || {}),
                [key]: value,
              },
            }
          : variant
      ),
    }));
  };

  const addVariant = () =>
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { ...EMPTY_VARIANT }],
    }));

  const removeVariant = (index) => {
    if (form.variants.length <= 1) {
      toast.error("At least one variant is required");
      return;
    }

    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast.error("Maximum 10 images can be uploaded");
      setImageFiles(files.slice(0, 10));
      return;
    }
    setImageFiles(files);
  };

  const handleVideos = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5) {
      toast.error("Maximum 5 videos can be uploaded");
      setVideoFiles(files.slice(0, 5));
      return;
    }
    setVideoFiles(files);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={submitting ? undefined : onClose} />

      <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden bg-neutral-50 lg:left-auto lg:w-[min(1100px,100%)]">
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              {editing ? <Pencil size={18} /> : <Plus size={18} />}
              <h2 className="text-base font-black">
                {editing ? "Edit Product" : "Create Product"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {editing
                ? "Update catalog, pricing, inventory, offers and SEO."
                : "Create a complete catalog product and submit it for approval."}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl border border-neutral-200 p-2.5 transition hover:border-black hover:bg-black hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
            <Section title="Basic Information" icon={Package}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Product Title" required>
                  <input
                    required
                    minLength={3}
                    maxLength={200}
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    className={inputClass}
                    placeholder="Wireless Bluetooth Earbuds"
                  />
                </Field>

                <Field label="Brand">
                  <input
                    value={form.brand}
                    onChange={(e) => update("brand", e.target.value)}
                    className={inputClass}
                    placeholder="OdiKart"
                  />
                </Field>

                <Field label="Category" required>
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        category: e.target.value,
                        subCategory: "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {parents.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                        {category.isActive === false ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory">
                  <select
                    value={form.subCategory}
                    onChange={(e) => update("subCategory", e.target.value)}
                    className={inputClass}
                    disabled={!form.category}
                  >
                    <option value="">No subcategory</option>
                    {subCategories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                        disabled={category.isActive === false}
                      >
                        {category.name}
                        {category.isActive === false ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Product Type">
                  <select
                    value={form.productType}
                    onChange={(e) => update("productType", e.target.value)}
                    className={inputClass}
                  >
                    <option value="simple">Simple</option>
                    <option value="variable">Variable</option>
                  </select>
                </Field>

                <Field label="Currency">
                  <select
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    className={inputClass}
                  >
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — Pound</option>
                  </select>
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Short Description">
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.shortDescription}
                    onChange={(e) => update("shortDescription", e.target.value)}
                    className={inputClass}
                    placeholder="Short customer-facing summary..."
                  />
                </Field>

                <Field label="Description" required hint="Minimum 10 characters.">
                  <textarea
                    required
                    minLength={10}
                    maxLength={20000}
                    rows={7}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className={inputClass}
                    placeholder="Detailed product description..."
                  />
                </Field>

                <Field label="Tags" hint="Comma separated">
                  <input
                    value={form.tagsText}
                    onChange={(e) => update("tagsText", e.target.value)}
                    className={inputClass}
                    placeholder="earbuds, bluetooth, wireless, audio"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Images & Videos" icon={ImageIcon}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Product Images" hint="Up to 10 images. JPG/PNG/WebP recommended.">
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-5 text-center transition hover:border-black">
                    <Upload size={24} />
                    <span className="mt-2 text-sm font-bold">Choose images</span>
                    <span className="mt-1 text-xs text-neutral-400">
                      {imageFiles.length
                        ? `${imageFiles.length} new image(s) selected`
                        : "Click to browse"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImages}
                    />
                  </label>
                </Field>

                <Field label="Product Videos" hint="Up to 5 videos.">
                  <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-5 text-center transition hover:border-black">
                    <Upload size={24} />
                    <span className="mt-2 text-sm font-bold">Choose videos</span>
                    <span className="mt-1 text-xs text-neutral-400">
                      {videoFiles.length
                        ? `${videoFiles.length} new video(s) selected`
                        : "Click to browse"}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleVideos}
                    />
                  </label>
                </Field>
              </div>

              {existingImages.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Existing images
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {existingImages.slice(0, 12).map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-white"
                      >
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {editing && (
                    <p className="mt-2 text-[10px] text-neutral-400">
                      Existing media is preserved. New media upload is used for new products;
                      your current update controller does not replace media files.
                    </p>
                  )}
                </div>
              )}
            </Section>

            <Section title="Variants & Inventory" icon={Boxes}>
              <div className="space-y-3">
                {form.variants.map((variant, index) => {
                  const attributeEntries = Object.entries(variant.attributes || {});
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black">Variant {index + 1}</p>
                          <p className="text-[10px] text-neutral-400">
                            SKU, original price, selling price, stock and attributes
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="rounded-lg border border-neutral-200 p-2 transition hover:border-black hover:bg-black hover:text-white"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="SKU" required>
                          <input
                            required
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(index, "sku", e.target.value.toUpperCase())
                            }
                            className={inputClass}
                            placeholder="ODK-EAR-001"
                          />
                        </Field>

                        <Field label="Original Price" required>
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={variant.originalPrice}
                            onChange={(e) =>
                              updateVariant(index, "originalPrice", e.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Selling Price" required hint="Backend recalculates this from offer.">
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(index, "price", e.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="HSN Code" required hint="Use the applicable HSN classification.">
                          <input
                            required
                            value={variant.hsnCode}
                            onChange={(e) =>
                              updateVariant(index, "hsnCode", e.target.value.trim().toUpperCase())
                            }
                            className={inputClass}
                            placeholder="3304"
                          />
                        </Field>

                        <Field label="GST Rate" required>
                          <select
                            required
                            value={variant.gstRate}
                            onChange={(e) =>
                              updateVariant(index, "gstRate", Number(e.target.value))
                            }
                            className={inputClass}
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </Field>

                        <Field label="Tax Inclusive">
                          <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3">
                            <input
                              type="checkbox"
                              checked={variant.taxInclusive !== false}
                              onChange={(e) =>
                                updateVariant(index, "taxInclusive", e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-semibold">Price includes GST</span>
                          </label>
                        </Field>

                        <Field label="Stock" required>
                          <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(index, "stock", e.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Weight">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.weight}
                            onChange={(e) =>
                              updateVariant(index, "weight", e.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Attribute Name" hint="e.g. Color">
                          <input
                            value={attributeEntries[0]?.[0] || ""}
                            onChange={(e) => {
                              const oldKey = attributeEntries[0]?.[0];
                              const oldValue = attributeEntries[0]?.[1] || "";
                              const nextKey = e.target.value.trim();
                              setForm((current) => ({
                                ...current,
                                variants: current.variants.map((item, i) => {
                                  if (i !== index) return item;
                                  const attrs = { ...(item.attributes || {}) };
                                  if (oldKey) delete attrs[oldKey];
                                  if (nextKey) attrs[nextKey] = oldValue;
                                  return { ...item, attributes: attrs };
                                }),
                              }));
                            }}
                            className={inputClass}
                            placeholder="Color"
                          />
                        </Field>

                        <Field label="Attribute Value" hint="e.g. Black">
                          <input
                            value={attributeEntries[0]?.[1] || ""}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                attributeEntries[0]?.[0] || "Attribute",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="Black"
                          />
                        </Field>

                        <label className="flex items-end gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
                          <input
                            type="checkbox"
                            checked={variant.isActive !== false}
                            onChange={(e) =>
                              updateVariant(index, "isActive", e.target.checked)
                            }
                            className="h-4 w-4 accent-black"
                          />
                          <span className="text-sm font-bold">Variant active</span>
                        </label>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addVariant}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-sm font-bold transition hover:border-black hover:bg-white"
                >
                  <Plus size={16} />
                  Add Variant
                </button>
              </div>
            </Section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title="Order Limits" icon={ShoppingCart}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Minimum Order Quantity">
                    <input
                      type="number"
                      min="1"
                      value={form.minimumOrderQuantity}
                      onChange={(e) =>
                        update("minimumOrderQuantity", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Maximum Order Quantity">
                    <input
                      type="number"
                      min="1"
                      value={form.maximumOrderQuantity}
                      onChange={(e) =>
                        update("maximumOrderQuantity", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Product Details" icon={Info}>
                <div className="grid gap-4">
                  <Field label="Material">
                    <input
                      value={form.material}
                      onChange={(e) => update("material", e.target.value)}
                      className={inputClass}
                      placeholder="ABS, Metal, Cotton..."
                    />
                  </Field>
                  <Field label="Warranty Information">
                    <input
                      value={form.warrantyInformation}
                      onChange={(e) =>
                        update("warrantyInformation", e.target.value)
                      }
                      className={inputClass}
                      placeholder="1 year manufacturer warranty"
                    />
                  </Field>
                </div>
              </Section>
            </div>

            <Section title="Shipping & Returns" icon={Truck}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-end gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={form.shipping.freeShipping}
                    onChange={(e) =>
                      updateNested("shipping", "freeShipping", e.target.checked)
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm font-bold">Free shipping</span>
                </label>

                <Field label="Shipping Charge">
                  <input
                    type="number"
                    min="0"
                    value={form.shipping.shippingCharge}
                    onChange={(e) =>
                      updateNested("shipping", "shippingCharge", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Processing Time (days)">
                  <input
                    type="number"
                    min="0"
                    value={form.shipping.processingTime}
                    onChange={(e) =>
                      updateNested("shipping", "processingTime", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Return Days">
                  <input
                    type="number"
                    min="0"
                    value={form.shipping.returnDays}
                    onChange={(e) =>
                      updateNested("shipping", "returnDays", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Serviceable Pincodes" hint="Comma separated">
                  <input
                    value={form.shipping.serviceablePincodesText}
                    onChange={(e) =>
                      updateNested(
                        "shipping",
                        "serviceablePincodesText",
                        e.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="760001, 751001, 500001"
                  />
                </Field>

                <Field label="Shipping Information">
                  <textarea
                    rows={3}
                    value={form.shippingInformation}
                    onChange={(e) =>
                      update("shippingInformation", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Dispatches within 1-2 business days..."
                  />
                </Field>

                <Field label="Return Policy">
                  <textarea
                    rows={3}
                    value={form.returnPolicy}
                    onChange={(e) => update("returnPolicy", e.target.value)}
                    className={inputClass}
                    placeholder="Eligible for return within 7 days..."
                  />
                </Field>
              </div>
            </Section>

            <Section title="Offer & Promotions" icon={Percent}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-end gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={form.offer.enabled}
                    onChange={(e) =>
                      updateNested("offer", "enabled", e.target.checked)
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm font-bold">Enable offer</span>
                </label>

                <Field label="Discount Type">
                  <select
                    value={form.offer.discountType}
                    onChange={(e) =>
                      updateNested("offer", "discountType", e.target.value)
                    }
                    className={inputClass}
                    disabled={!form.offer.enabled}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </Field>

                <Field label="Discount Value">
                  <input
                    type="number"
                    min="0"
                    value={form.offer.value}
                    onChange={(e) =>
                      updateNested("offer", "value", e.target.value)
                    }
                    className={inputClass}
                    disabled={!form.offer.enabled}
                  />
                </Field>

                <Field label="Offer Label">
                  <input
                    value={form.offer.label}
                    onChange={(e) =>
                      updateNested("offer", "label", e.target.value)
                    }
                    className={inputClass}
                    disabled={!form.offer.enabled}
                    placeholder="20% OFF"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Discovery & Merchandising" icon={Sparkles}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["featured", "Featured"],
                  ["trending", "Trending"],
                  ["bestSeller", "Best Seller"],
                  ["isNewArrival", "New Arrival"],
                  ["isActive", "Active"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) => update(key, e.target.checked)}
                      className="h-4 w-4 accent-black"
                    />
                    <span className="text-xs font-bold">{label}</span>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="SEO" icon={Globe2}>
              <div className="grid gap-4">
                <Field label="Meta Title">
                  <input
                    value={form.seo.metaTitle}
                    onChange={(e) =>
                      updateNested("seo", "metaTitle", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Wireless Earbuds | OdiKart"
                  />
                </Field>

                <Field label="Meta Description">
                  <textarea
                    rows={3}
                    value={form.seo.metaDescription}
                    onChange={(e) =>
                      updateNested("seo", "metaDescription", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Canonical URL">
                  <input
                    type="url"
                    value={form.seo.canonicalUrl}
                    onChange={(e) =>
                      updateNested("seo", "canonicalUrl", e.target.value)
                    }
                    className={inputClass}
                    placeholder="https://odikart.in/product/..."
                  />
                </Field>

                <Field label="SEO Keywords" hint="Comma separated">
                  <input
                    value={form.seo.keywordsText}
                    onChange={(e) =>
                      updateNested("seo", "keywordsText", e.target.value)
                    }
                    className={inputClass}
                    placeholder="wireless earbuds, bluetooth earbuds"
                  />
                </Field>
              </div>
            </Section>
          </div>

          <footer className="sticky bottom-0 border-t border-neutral-200 bg-white p-3 sm:p-4">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-bold hover:border-black disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-40"
              >
                {submitting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {submitting
                  ? "Saving..."
                  : editing
                  ? "Save Changes"
                  : "Create & Submit"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};


const Products = () => {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      total: 0,
      page: 1,
      pages: 1,
      limit: PAGE_LIMIT,
    });

  const [stats, setStats] =
    useState({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      blocked: 0,
      draft: 0,
    });

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [reasonModal, setReasonModal] =
    useState({
      open: false,
      type: null,
      product: null,
    });

  const [reason, setReason] =
    useState("");

  const [mobileFilterOpen, setMobileFilterOpen] =
    useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editorForm, setEditorForm] = useState({
    ...EMPTY_FORM,
    variants: [{ ...EMPTY_VARIANT }],
  });
  const [editorCategories, setEditorCategories] = useState([]);
  const [editorImageFiles, setEditorImageFiles] = useState([]);
  const [editorVideoFiles, setEditorVideoFiles] = useState([]);
  const [editorExistingImages, setEditorExistingImages] = useState([]);
  const [editorSubmitting, setEditorSubmitting] = useState(false);


  const loadEditorCategories = async () => {
    try {
      const response = await adminApi.get("/category/admin/tree");
      setEditorCategories(normalizeTree(response.data || response));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load categories");
    }
  };

  const openCreateProduct = async () => {
    setEditingProduct(null);
    setEditorForm({
      ...EMPTY_FORM,
      variants: [{ ...EMPTY_VARIANT }],
    });
    setEditorImageFiles([]);
    setEditorVideoFiles([]);
    setEditorExistingImages([]);
    setEditorOpen(true);
    await loadEditorCategories();
  };

  const openEditProduct = async (product) => {
    setEditingProduct(product);
    setEditorForm(toEditorForm(product));
    setEditorImageFiles([]);
    setEditorVideoFiles([]);
    setEditorExistingImages(getProductImages(product));
    setEditorOpen(true);
    await loadEditorCategories();
  };

  const closeProductEditor = () => {
    if (editorSubmitting) return;
    setEditorOpen(false);
    setEditingProduct(null);
    setEditorForm({
      ...EMPTY_FORM,
      variants: [{ ...EMPTY_VARIANT }],
    });
    setEditorImageFiles([]);
    setEditorVideoFiles([]);
    setEditorExistingImages([]);
  };

  const validateEditor = () => {
    if (editorForm.title.trim().length < 3) {
      toast.error("Product title must be at least 3 characters");
      return false;
    }

    if (editorForm.description.trim().length < 10) {
      toast.error("Product description must be at least 10 characters");
      return false;
    }

    if (!editorForm.category) {
      toast.error("Category is required");
      return false;
    }

    if (!editorForm.variants.length) {
      toast.error("At least one variant is required");
      return false;
    }

    const seen = new Set();

    for (const variant of editorForm.variants) {
      const sku = String(variant.sku || "").trim().toUpperCase();
      const price = Number(variant.price);
      const originalPrice = Number(variant.originalPrice);
      const stock = Number(variant.stock);
      const weight = Number(variant.weight || 0);
      const gstRate = Number(variant.gstRate);
      const hsnCode = String(variant.hsnCode || "").trim();

      if (!sku) {
        toast.error("Every variant needs a SKU");
        return false;
      }

      if (seen.has(sku)) {
        toast.error(`Duplicate SKU: ${sku}`);
        return false;
      }

      seen.add(sku);

      if (!Number.isFinite(price) || price < 0) {
        toast.error(`Invalid selling price for ${sku}`);
        return false;
      }

      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        toast.error(`Invalid original price for ${sku}`);
        return false;
      }

      if (!hsnCode) {
        toast.error(`HSN code is required for ${sku}`);
        return false;
      }

      if (![0, 5, 12, 18, 28].includes(gstRate)) {
        toast.error(`Invalid GST rate for ${sku}`);
        return false;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        toast.error(`Invalid stock for ${sku}`);
        return false;
      }

      if (!Number.isFinite(weight) || weight < 0) {
        toast.error(`Invalid weight for ${sku}`);
        return false;
      }
    }

    if (
      editorForm.offer.enabled &&
      editorForm.offer.discountType === "percentage" &&
      (Number(editorForm.offer.value) <= 0 ||
        Number(editorForm.offer.value) > 100)
    ) {
      toast.error("Percentage offer must be between 1 and 100");
      return false;
    }

    if (
      editorForm.offer.enabled &&
      editorForm.offer.discountType === "fixed" &&
      Number(editorForm.offer.value) <= 0
    ) {
      toast.error("Fixed offer must be greater than 0");
      return false;
    }

    return true;
  };

  const buildEditorPayload = () => ({
    title: editorForm.title.trim(),
    description: editorForm.description.trim(),
    shortDescription: editorForm.shortDescription.trim(),
    category: editorForm.category,
    subCategory: editorForm.subCategory || null,
    brand: editorForm.brand.trim(),
    productType: editorForm.productType,
    variants: editorForm.variants.map((variant) => ({
      ...variant,
      sku: String(variant.sku || "").trim().toUpperCase(),
      originalPrice: Number(variant.originalPrice || 0),
      price: Number(variant.price || 0),
      hsnCode: String(variant.hsnCode || "").trim().toUpperCase(),
      gstRate: Number(variant.gstRate ?? 0),
      taxInclusive: variant.taxInclusive !== false,
      stock: Number(variant.stock || 0),
      weight: Number(variant.weight || 0),
      isActive: variant.isActive !== false,
    })),
    currency: editorForm.currency,
    minimumOrderQuantity: Number(editorForm.minimumOrderQuantity || 1),
    maximumOrderQuantity: Number(editorForm.maximumOrderQuantity || 10),
    tags: parseList(editorForm.tagsText),
    material: editorForm.material.trim(),
    warrantyInformation: editorForm.warrantyInformation.trim(),
    returnPolicy: editorForm.returnPolicy.trim(),
    shippingInformation: editorForm.shippingInformation.trim(),
    shipping: {
      freeShipping: Boolean(editorForm.shipping.freeShipping),
      shippingCharge: Number(editorForm.shipping.shippingCharge || 0),
      processingTime: Number(editorForm.shipping.processingTime || 0),
      returnDays: Number(editorForm.shipping.returnDays || 0),
      serviceablePincodes: parseList(
        editorForm.shipping.serviceablePincodesText
      ),
    },
    seo: {
      metaTitle: editorForm.seo.metaTitle.trim(),
      metaDescription: editorForm.seo.metaDescription.trim(),
      canonicalUrl: editorForm.seo.canonicalUrl.trim(),
      keywords: parseList(editorForm.seo.keywordsText),
    },
    offer: {
      enabled: Boolean(editorForm.offer.enabled),
      discountType: editorForm.offer.discountType,
      value: Number(editorForm.offer.value || 0),
      label: editorForm.offer.label.trim(),
    },
    featured: Boolean(editorForm.featured),
    trending: Boolean(editorForm.trending),
    bestSeller: Boolean(editorForm.bestSeller),
    isNewArrival: Boolean(editorForm.isNewArrival),
    isActive: Boolean(editorForm.isActive),
  });

  const submitProductEditor = async () => {
    if (!validateEditor()) return;

    try {
      setEditorSubmitting(true);
      const payload = buildEditorPayload();

      if (editingProduct?._id) {
        await adminApi.put(`/products/${editingProduct._id}`, payload);
        toast.success("Product updated successfully");
      } else {
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (
            ["tags", "variants", "shipping", "seo", "offer"].includes(key)
          ) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });

        editorImageFiles.forEach((file) => formData.append("images", file));
        editorVideoFiles.forEach((file) => formData.append("videos", file));

        await adminApi.post("/products/create", formData);
        toast.success("Product created and submitted for approval");
      }

      closeProductEditor();
      await fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save product");
    } finally {
      setEditorSubmitting(false);
    }
  };

  /* =======================================================
     FETCH PRODUCTS
  ======================================================= */

  const fetchProducts = async ({
    requestedPage = page,
    requestedStatus = status,
    requestedSearch = search,
  } = {}) => {
    try {
      setLoading(true);

      const params = {
        page: requestedPage,
        limit: PAGE_LIMIT,
      };

      if (
        requestedStatus &&
        requestedStatus !== "all"
      ) {
        params.status =
          requestedStatus;
      }

      if (
        requestedSearch &&
        requestedSearch.trim()
      ) {
        params.search =
          requestedSearch.trim();
      }

      /*
        REAL BACKEND ROUTE:

        GET /api/products/admin/all
      */

      const response =
        await adminApi.get(
          "/products/admin/all",
          {
            params,
          }
        );

      const data = response.data || {};

      const fetchedProducts =
        Array.isArray(data.products)
          ? data.products
          : [];

      setProducts(fetchedProducts);

      /*
        Backend may return either:

        pending
        approved
        rejected
        blocked
        draft

        or a statusCounts object.

        Support both.
      */

      const counts =
        data.statusCounts || {};

      setStats({
        total:
          Number(
            data.total ??
              data.count ??
              0
          ),

        pending:
          Number(
            data.pending ??
              counts.pending ??
              0
          ),

        approved:
          Number(
            data.approved ??
              counts.approved ??
              0
          ),

        rejected:
          Number(
            data.rejected ??
              counts.rejected ??
              0
          ),

        blocked:
          Number(
            data.blocked ??
              counts.blocked ??
              0
          ),

        draft:
          Number(
            data.draft ??
              counts.draft ??
              0
          ),
      });

      const total =
        Number(
          data.total ??
            data.count ??
            0
        );

      const responseLimit =
        Number(
          data.limit || PAGE_LIMIT
        );

      const responsePage =
        Number(
          data.page ||
            requestedPage
        );

      const responsePages =
        Number(
          data.pages ??
            data.totalPages ??
            Math.max(
              1,
              Math.ceil(
                total /
                  responseLimit
              )
            )
        );

      setPagination({
        total,
        page: responsePage,
        pages: responsePages,
        limit: responseLimit,
      });
    } catch (error) {
      console.error(
        "Admin product fetch error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Failed to load products"
      );

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL + STATUS/PAGE
  ======================================================= */

  useEffect(() => {
    fetchProducts();
  }, [page, status]);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        setPage(1);

        fetchProducts({
          requestedPage: 1,
          requestedStatus: status,
          requestedSearch:
            search,
        });
      }, 500);

    return () =>
      clearTimeout(timer);
  }, [search]);

  /* =======================================================
     APPROVE
  ======================================================= */

  const handleApprove = async (
    product
  ) => {
    if (!product?._id) return;

    try {
      setActionLoading(
        product._id
      );

      await adminApi.put(
        `/products/admin/${product._id}/approve`
      );

      toast.success(
        "Product approved successfully"
      );

      setSelectedProduct(null);

      await fetchProducts();
    } catch (error) {
      console.error(
        "Approve product error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Failed to approve product"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =======================================================
     OPEN REASON MODAL
  ======================================================= */

  const openReasonModal = (
    product,
    type
  ) => {
    setReason("");

    setReasonModal({
      open: true,
      type,
      product,
    });
  };

  /* =======================================================
     CLOSE REASON MODAL
  ======================================================= */

  const closeReasonModal = () => {
    setReasonModal({
      open: false,
      type: null,
      product: null,
    });

    setReason("");
  };

  /* =======================================================
     REJECT / BLOCK
  ======================================================= */

  const submitReasonAction =
    async () => {
      const product =
        reasonModal.product;

      if (!product?._id) return;

      if (!reason.trim()) {
        toast.error(
          "Please enter a reason"
        );

        return;
      }

      try {
        setActionLoading(
          product._id
        );

        let endpoint = "";

        if (
          reasonModal.type ===
          "reject"
        ) {
          endpoint = `/products/admin/${product._id}/reject`;
        } else {
          endpoint = `/products/admin/${product._id}/block`;
        }

        await adminApi.put(
          endpoint,
          {
            reason:
              reason.trim(),
          }
        );

        toast.success(
          reasonModal.type ===
            "reject"
            ? "Product rejected successfully"
            : "Product blocked successfully"
        );

        closeReasonModal();

        setSelectedProduct(null);

        await fetchProducts();
      } catch (error) {
        console.error(
          "Product action error:",
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Action failed"
        );
      } finally {
        setActionLoading(null);
      }
    };

  /* =======================================================
     COPY PRODUCT ID
  ======================================================= */

  const copyProductId = async (
    product
  ) => {
    try {
      await navigator.clipboard.writeText(
        product?._id || ""
      );

      toast.success(
        "Product ID copied"
      );
    } catch {
      toast.error(
        "Could not copy ID"
      );
    }
  };

  /* =======================================================
     CURRENT PRODUCTS
  ======================================================= */

  const visibleProducts =
    useMemo(() => {
      return products;
    }, [products]);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white sm:h-12 sm:w-12">
              <Package
                size={21}
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Products
              </h1>

              <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
                Manage, review and moderate
                your marketplace catalog
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={openCreateProduct}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-bold text-white transition hover:bg-neutral-800 sm:flex-none"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>

            <button
              type="button"
              onClick={() =>
                fetchProducts()
              }
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-black px-4 text-sm font-bold transition hover:bg-black hover:text-white disabled:opacity-40 sm:flex-none"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span>
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <StatCard
            label="All"
            value={stats.total}
            icon={Package}
            active={
              status === "all"
            }
            onClick={() => {
              setStatus("all");
              setPage(1);
            }}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock3}
            active={
              status === "pending"
            }
            onClick={() => {
              setStatus("pending");
              setPage(1);
            }}
          />

          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            active={
              status === "approved"
            }
            onClick={() => {
              setStatus("approved");
              setPage(1);
            }}
          />

          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
            active={
              status === "rejected"
            }
            onClick={() => {
              setStatus("rejected");
              setPage(1);
            }}
          />

          <StatCard
            label="Blocked"
            value={stats.blocked}
            icon={Ban}
            active={
              status === "blocked"
            }
            onClick={() => {
              setStatus("blocked");
              setPage(1);
            }}
          />

          <StatCard
            label="Draft"
            value={stats.draft}
            icon={Package}
            active={
              status === "draft"
            }
            onClick={() => {
              setStatus("draft");
              setPage(1);
            }}
          />
        </div>

        {/* =================================================
            SEARCH / FILTER
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                type="text"
                placeholder="Search product title..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileFilterOpen(
                  (current) =>
                    !current
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-bold lg:hidden"
            >
              Status
              <ChevronDown
                size={16}
                className={
                  mobileFilterOpen
                    ? "rotate-180"
                    : ""
                }
              />
            </button>

            <div
              className={`${
                mobileFilterOpen
                  ? "block"
                  : "hidden"
              } lg:block`}
            >
              <select
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold outline-none focus:border-black lg:w-48"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Product
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Seller
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Price
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Inventory
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Performance
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({
                    length: 7,
                  }).map(
                    (_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse border-b border-neutral-100"
                      >
                        <td className="px-5 py-5">
                          <div className="flex gap-3">
                            <div className="h-14 w-14 rounded-xl bg-neutral-200" />

                            <div className="space-y-2">
                              <div className="h-4 w-52 rounded bg-neutral-200" />

                              <div className="h-3 w-32 rounded bg-neutral-200" />

                              <div className="h-5 w-28 rounded-full bg-neutral-200" />
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="h-4 w-28 rounded bg-neutral-200" />
                        </td>

                        <td>
                          <div className="h-4 w-24 rounded bg-neutral-200" />
                        </td>

                        <td>
                          <div className="h-4 w-24 rounded bg-neutral-200" />
                        </td>

                        <td>
                          <div className="h-4 w-14 rounded bg-neutral-200" />
                        </td>

                        <td>
                          <div className="h-4 w-20 rounded bg-neutral-200" />
                        </td>

                        <td>
                          <div className="h-6 w-20 rounded-full bg-neutral-200" />
                        </td>

                        <td>
                          <div className="ml-auto h-9 w-9 rounded-xl bg-neutral-200" />
                        </td>
                      </tr>
                    )
                  )
                ) : visibleProducts.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-20 text-center"
                    >
                      <Package
                        size={48}
                        className="mx-auto mb-4 text-neutral-300"
                      />

                      <p className="text-sm font-bold">
                        No products found
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Try another search or
                        status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibleProducts.map(
                    (product) => {
                      const stock =
                        getTotalStock(
                          product
                        );

                      const sold =
                        getTotalSold(
                          product
                        );

                      return (
                        <tr
                          key={
                            product._id
                          }
                          className="border-b border-neutral-100 transition hover:bg-neutral-50"
                        >
                          {/* PRODUCT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                product={
                                  product
                                }
                                className="h-14 w-14 shrink-0 rounded-xl"
                              />

                              <div className="min-w-0">
                                <div className="flex max-w-[300px] items-center gap-2">
                                  <p className="truncate text-sm font-bold">
                                    {getProductTitle(
                                      product
                                    )}
                                  </p>

                                  {product.productType ===
                                    "variable" && (
                                    <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold">
                                      VARIABLE
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {getProductBrand(
                                    product
                                  )}{" "}
                                  •{" "}
                                  {getVariants(
                                    product
                                  ).length}{" "}
                                  variants
                                </p>

                                <div className="mt-1.5">
                                  <ProductFlags
                                    product={
                                      product
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SELLER */}

                          <td className="px-5 py-4">
                            <div className="max-w-[170px]">
                              <p className="truncate text-sm font-semibold">
                                {getSellerName(
                                  product
                                )}
                              </p>

                              <p className="mt-1 truncate text-xs text-neutral-400">
                                {getStoreName(
                                  product
                                )}
                              </p>
                            </div>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold">
                              {getCategoryName(
                                product
                              )}
                            </p>

                            {getSubCategoryName(
                              product
                            ) && (
                              <p className="mt-1 text-xs text-neutral-400">
                                {getSubCategoryName(
                                  product
                                )}
                              </p>
                            )}
                          </td>

                          {/* PRICE */}

                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap text-sm font-black">
                              {getPriceRange(
                                product
                              )}
                            </p>

                            {getDiscount(
                              product
                            ) > 0 && (
                              <p className="mt-1 text-[11px] font-semibold text-neutral-400">
                                {
                                  getDiscount(
                                    product
                                  )
                                }
                                % off
                              </p>
                            )}
                          </td>

                          {/* INVENTORY */}

                          <td className="px-5 py-4">
                            <p
                              className={`text-sm font-black ${
                                stock <= 5
                                  ? "underline decoration-2 underline-offset-4"
                                  : ""
                              }`}
                            >
                              {stock}
                            </p>

                            <p className="mt-1 text-[11px] text-neutral-400">
                              {sold} sold
                            </p>
                          </td>

                          {/* PERFORMANCE */}

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <p className="text-xs font-bold">
                                {getViews(
                                  product
                                )}{" "}
                                views
                              </p>

                              <p className="text-[11px] text-neutral-400">
                                {getTrendingScore(
                                  product
                                )}{" "}
                                trend score
                              </p>
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                product.status
                              }
                            />
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedProduct(
                                    product
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 transition hover:border-black hover:bg-black hover:text-white"
                                title="View product"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="space-y-3 lg:hidden">
          {loading ? (
            Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-neutral-200 p-4"
              >
                <div className="flex gap-3">
                  <div className="h-20 w-20 rounded-xl bg-neutral-200" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-neutral-200" />

                    <div className="h-3 w-1/2 rounded bg-neutral-200" />

                    <div className="h-6 w-20 rounded-full bg-neutral-200" />
                  </div>
                </div>
              </div>
            ))
          ) : visibleProducts.length ===
            0 ? (
            <div className="rounded-2xl border border-neutral-200 px-5 py-16 text-center">
              <Package
                size={48}
                className="mx-auto mb-3 text-neutral-300"
              />

              <p className="text-sm font-bold">
                No products found
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Try changing your filters.
              </p>
            </div>
          ) : (
            visibleProducts.map(
              (product) => {
                const stock =
                  getTotalStock(
                    product
                  );

                const sold =
                  getTotalSold(
                    product
                  );

                return (
                  <article
                    key={
                      product._id
                    }
                    className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <ProductImage
                        product={
                          product
                        }
                        className="h-20 w-20 shrink-0 rounded-xl"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-sm font-black leading-5">
                              {getProductTitle(
                                product
                              )}
                            </h2>

                            <p className="mt-1 truncate text-xs text-neutral-400">
                              {getProductBrand(
                                product
                              )}
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              product.status
                            }
                          />
                        </div>

                        <div className="mt-2">
                          <ProductFlags
                            product={
                              product
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-[10px] font-semibold uppercase text-neutral-400">
                          Price
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {getPriceRange(
                            product
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-[10px] font-semibold uppercase text-neutral-400">
                          Stock
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {stock}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-[10px] font-semibold uppercase text-neutral-400">
                          Seller
                        </p>

                        <p className="mt-1 truncate text-xs font-bold">
                          {getStoreName(
                            product
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-50 p-3">
                        <p className="text-[10px] font-semibold uppercase text-neutral-400">
                          Sold
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {sold}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-neutral-400">
                          Category
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-xs font-semibold">
                          {getCategoryName(
                            product
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-black px-4 text-xs font-bold transition hover:bg-black hover:text-white"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProduct(
                            product
                          )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-xs font-bold text-white transition hover:bg-neutral-800"
                      >
                        <Eye
                          size={15}
                        />

                        View
                      </button>
                      </div>
                    </div>

                    {product.status ===
                      "pending" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            product._id
                          }
                          onClick={() =>
                            handleApprove(
                              product
                            )
                          }
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-black text-xs font-bold text-white disabled:opacity-40"
                        >
                          <Check
                            size={15}
                          />

                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            product._id
                          }
                          onClick={() =>
                            openReasonModal(
                              product,
                              "reject"
                            )
                          }
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-black text-xs font-bold transition hover:bg-black hover:text-white disabled:opacity-40"
                        >
                          <XCircle
                            size={15}
                          />

                          Reject
                        </button>
                      </div>
                    )}

                    {product.status ===
                      "approved" && (
                      <button
                        type="button"
                        disabled={
                          actionLoading ===
                          product._id
                        }
                        onClick={() =>
                          openReasonModal(
                            product,
                            "block"
                          )
                        }
                        className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black text-xs font-bold transition hover:bg-black hover:text-white disabled:opacity-40"
                      >
                        <Ban
                          size={15}
                        />

                        Block Product
                      </button>
                    )}
                  </article>
                );
              }
            )
          )}
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          visibleProducts.length >
            0 && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-neutral-400">
                  Showing page
                </p>

                <p className="text-sm font-bold">
                  {pagination.page ||
                    page}{" "}
                  of{" "}
                  {pagination.pages ||
                    1}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current -
                            1
                        )
                    )
                  }
                  className="flex h-10 items-center justify-center gap-1 rounded-xl border border-neutral-200 px-3 text-xs font-bold transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:text-sm"
                >
                  <ChevronLeft
                    size={15}
                  />

                  <span className="hidden sm:inline">
                    Previous
                  </span>

                  <span className="sm:hidden">
                    Prev
                  </span>
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    (pagination.pages ||
                      1)
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          pagination.pages ||
                            1,
                          current +
                            1
                        )
                    )
                  }
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-black px-3 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30 sm:px-4 sm:text-sm"
                >
                  <span>
                    Next
                  </span>

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* =====================================================
          PRODUCT DETAIL
      ===================================================== */}

      <ProductDetail
        product={
          selectedProduct
        }
        onClose={() =>
          setSelectedProduct(null)
        }
        onApprove={
          handleApprove
        }
        onReject={(product) =>
          openReasonModal(
            product,
            "reject"
          )
        }
        onBlock={(product) =>
          openReasonModal(
            product,
            "block"
          )
        }
        onEdit={openEditProduct}
        actionLoading={
          actionLoading
        }
      />

      {/* =====================================================
          REASON MODAL
      ===================================================== */}

      <ProductEditor
        open={editorOpen}
        editing={editingProduct}
        form={editorForm}
        setForm={setEditorForm}
        categories={editorCategories}
        imageFiles={editorImageFiles}
        setImageFiles={setEditorImageFiles}
        videoFiles={editorVideoFiles}
        existingImages={editorExistingImages}
        onClose={closeProductEditor}
        onSubmit={submitProductEditor}
        submitting={editorSubmitting}
      />

      {reasonModal.open && (
        <ReasonModal
          type={
            reasonModal.type
          }
          product={
            reasonModal.product
          }
          reason={reason}
          setReason={setReason}
          onClose={
            closeReasonModal
          }
          onSubmit={
            submitReasonAction
          }
          loading={
            actionLoading ===
            reasonModal.product
              ?._id
          }
        />
      )}
    </div>
  );
};

export default Products;
