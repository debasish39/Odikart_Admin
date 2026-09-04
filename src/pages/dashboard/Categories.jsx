import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Star,
  StarOff,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers3,
  Package,
  X,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Power,
  Droplets,
  Shirt,
  Smartphone,
  ShoppingBasket,
  Sparkles,
  BookOpen,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryApi";

const INITIAL_FORM = {
  name: "",
  description: "",
  image: "",
  icon: "",
  parentCategory: "",
  featured: false,
  displayOrder: 0,
  isActive: true,
};

const ICONS = {
  water: Droplets,
  fashion: Shirt,
  electronics: Smartphone,
  grocery: ShoppingBasket,
  beauty: Sparkles,
  books: BookOpen,
};

const getChildren = (category) =>
  category?.subCategories ||
  category?.subcategories ||
  category?.children ||
  [];

const normalizeCategories = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.categories)) return response.data.categories;
  return [];
};

const flattenCategories = (items, result = []) => {
  items.forEach((item) => {
    result.push(item);
    flattenCategories(getChildren(item), result);
  });
  return result;
};

const getIconKey = (category) =>
  String(category?.icon || category?.slug || category?.name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

function CategoryIcon({ category, size = 19 }) {
  const key = getIconKey(category);
  const Icon = ICONS[key] || Tag;

  return <Icon size={size} strokeWidth={2} />;
}

function CategoryImage({ category, large = false }) {
  const [failed, setFailed] = useState(false);

  if (!category?.image || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400 ${
          large ? "h-14 w-14" : "h-11 w-11"
        }`}
      >
        <ImageIcon size={large ? 22 : 18} />
      </div>
    );
  }

  return (
    <img
      src={category.image}
      alt={category.name || "Category"}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-xl border border-slate-200 bg-white object-cover ${
        large ? "h-14 w-14" : "h-11 w-11"
      }`}
    />
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CategoryRow({
  category,
  level = 0,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onStatus,
  onFeatured,
  onAddSubcategory,
}) {
  const children = getChildren(category);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(category._id);

  return (
    <>
      {/* Desktop */}
      <div className="hidden border-b border-slate-100 px-5 py-3.5 transition hover:bg-slate-50 md:grid md:grid-cols-[minmax(300px,1.8fr)_100px_100px_110px_210px] md:items-center md:gap-4">
        <div
          className="flex min-w-0 items-center gap-3"
          style={{ paddingLeft: `${level * 28}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(category._id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
            >
              {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            </button>
          ) : (
            <span className="w-7 shrink-0" />
          )}

          <CategoryImage category={category} />

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <CategoryIcon category={category} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-slate-900">
                {category.name}
              </p>
              {category.featured && (
                <Star
                  size={14}
                  className="shrink-0 fill-current text-amber-500"
                />
              )}
            </div>

            <p className="truncate text-xs text-slate-400">
              /{category.slug || getIconKey(category)}
            </p>
          </div>
        </div>

        <span className="text-sm text-slate-600">
          {Number(category.productCount || 0)}
        </span>

        <span className="w-fit rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          #{Number(category.displayOrder || 0)}
        </span>

        <StatusBadge active={category.isActive !== false} />

        <div className="flex justify-end gap-1">
          {!category.parentCategory && (
            <button
              type="button"
              title="Add subcategory"
              onClick={() => onAddSubcategory(category._id)}
              className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-600"
            >
              <Plus size={17} />
            </button>
          )}

          <button
            type="button"
            title={category.featured ? "Remove featured" : "Make featured"}
            onClick={() => onFeatured(category)}
            className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
          >
            {category.featured ? (
              <Star size={17} className="fill-current" />
            ) : (
              <StarOff size={17} />
            )}
          </button>

          <button
            type="button"
            title={category.isActive === false ? "Activate" : "Deactivate"}
            onClick={() => onStatus(category)}
            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          >
            <Power size={17} />
          </button>

          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(category)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            title="Delete"
            onClick={() => onDelete(category)}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="border-b border-slate-100 px-4 py-4 md:hidden">
        <div className="flex gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(category._id)}
              className="mt-1 shrink-0 rounded-lg p-1 text-slate-400"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className="w-7 shrink-0" />
          )}

          <div className="relative shrink-0">
            <CategoryImage category={category} />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white">
              <CategoryIcon category={category} size={10} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold text-slate-900">
                    {category.name}
                  </p>
                  {category.featured && (
                    <Star
                      size={13}
                      className="shrink-0 fill-current text-amber-500"
                    />
                  )}
                </div>

                <p className="truncate text-xs text-slate-400">
                  /{category.slug || getIconKey(category)}
                </p>
              </div>

              <StatusBadge active={category.isActive !== false} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Package size={14} />
                  {Number(category.productCount || 0)}
                </span>
                <span>Order #{Number(category.displayOrder || 0)}</span>
              </div>

              <div className="flex shrink-0 gap-0.5">
                {!category.parentCategory && (
                  <button
                    type="button"
                    onClick={() => onAddSubcategory(category._id)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-600"
                  >
                    <Plus size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onFeatured(category)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                >
                  {category.featured ? (
                    <Star size={16} className="fill-current" />
                  ) : (
                    <StarOff size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(category)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded &&
        children.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatus={onStatus}
            onFeatured={onFeatured}
            onAddSubcategory={onAddSubcategory}
          />
        ))}
    </>
  );
}

function CategoryModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  editing,
  submitting,
  parents,
}) {
  if (!open) return null;

  const isSubcategory = Boolean(form.parentCategory);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-5">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:max-w-2xl md:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editing
                ? "Edit Category"
                : isSubcategory
                ? "Create Subcategory"
                : "Create Category"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {isSubcategory
                ? "Create a child category under the selected parent."
                : "Create a main category for your catalog."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5 p-5 md:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Name *
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Electronics"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Parent Category
              </span>
              <select
                value={form.parentCategory}
                onChange={(e) =>
                  setForm({ ...form, parentCategory: e.target.value })
                }
                disabled={editing && Boolean(form.parentCategory)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
              >
                <option value="">No parent — Main Category</option>
                {parents.map((parent) => (
                  <option key={parent._id} value={parent._id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Short description..."
              maxLength={500}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Image URL
              </span>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Icon
              </span>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">Auto detect from name</option>
                <option value="water">Water</option>
                <option value="fashion">Fashion</option>
                <option value="electronics">Electronics</option>
                <option value="grocery">Grocery</option>
                <option value="beauty">Beauty</option>
                <option value="books">Books</option>
              </select>
            </label>
          </div>

          {form.image && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <CategoryImage category={{ image: form.image }} large />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  Image Preview
                </p>
                <p className="truncate text-xs text-slate-400">
                  {form.image}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Display Order
              </span>
              <input
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    displayOrder: Number(e.target.value) || 0,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={Boolean(form.featured)}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="h-4 w-4 accent-slate-900"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Featured
                </span>
                <span className="block text-xs text-slate-500">
                  Highlight this category in the storefront.
                </span>
              </span>
            </label>
          </div>

          {editing && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 accent-slate-900"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Active
                </span>
                <span className="block text-xs text-slate-500">
                  Inactive categories won't appear in the active catalog.
                </span>
              </span>
            </label>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}

              {editing ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ category, onClose, onConfirm, deleting }) {
  if (!category) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl md:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={21} />
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Delete category?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This will deactivate{" "}
          <strong className="text-slate-800">{category.name}</strong>. Your
          backend uses soft delete, so existing data is preserved.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <RefreshCw size={16} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getCategoryTree();
      setCategories(normalizeCategories(response));
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load categories";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const allCategories = useMemo(
    () => flattenCategories(categories),
    [categories]
  );

  const parentCategories = useMemo(
    () => categories.filter((category) => !category.parentCategory),
    [categories]
  );

  const filteredTree = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filterTree = (items) =>
      items
        .map((category) => {
          const children = getChildren(category);
          const matchingChildren = filterTree(children);

          const matchesSearch =
            !keyword ||
            category.name?.toLowerCase().includes(keyword) ||
            category.slug?.toLowerCase().includes(keyword) ||
            category.description?.toLowerCase().includes(keyword);

          const active = category.isActive !== false;

          const matchesFilter =
            filter === "all" ||
            (filter === "active" && active) ||
            (filter === "inactive" && !active) ||
            (filter === "featured" && Boolean(category.featured));

          if ((matchesSearch && matchesFilter) || matchingChildren.length) {
            return {
              ...category,
              subCategories: matchingChildren,
            };
          }

          return null;
        })
        .filter(Boolean);

    return filterTree(categories);
  }, [categories, search, filter]);

  const stats = useMemo(() => {
    const total = allCategories.length;
    const active = allCategories.filter((c) => c.isActive !== false).length;
    const inactive = total - active;
    const featured = allCategories.filter((c) => c.featured).length;
    const products = allCategories.reduce(
      (sum, category) => sum + Number(category.productCount || 0),
      0
    );

    return { total, active, inactive, featured, products };
  }, [allCategories]);

  const openCreate = (parentCategory = "") => {
    setEditing(null);
    setForm({
      ...INITIAL_FORM,
      parentCategory,
    });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    const parent =
      typeof category.parentCategory === "object"
        ? category.parentCategory?._id || ""
        : category.parentCategory || "";

    setEditing(category);

    setForm({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      icon: category.icon || "",
      parentCategory: parent,
      featured: Boolean(category.featured),
      displayOrder: Number(category.displayOrder || 0),
      isActive: category.isActive !== false,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setEditing(null);
    setForm(INITIAL_FORM);
  };

  const submitCategory = async () => {
    const name = form.name.trim();

    if (!name) {
      toast.error("Category name is required");
      return;
    }

    if (name.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name,
        description: form.description.trim(),
        image: form.image.trim(),
        icon: form.icon.trim(),
        featured: Boolean(form.featured),
        displayOrder: Number(form.displayOrder) || 0,
      };

      if (form.parentCategory) {
        payload.parentCategory = form.parentCategory;
      }

      if (editing) {
        payload.isActive = form.isActive !== false;

        await updateCategory(editing._id, payload);
        toast.success("Category updated successfully");
      } else {
        await createCategory(payload);

        toast.success(
          form.parentCategory
            ? "Subcategory created successfully"
            : "Category created successfully"
        );
      }

      closeModal();
      await loadCategories(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not save category"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteCategory(deleteTarget._id);

      toast.success("Category deactivated successfully");

      setDeleteTarget(null);
      await loadCategories(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not delete category"
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (category) => {
    try {
      await updateCategory(category._id, {
        isActive: category.isActive === false,
      });

      toast.success(
        category.isActive === false
          ? "Category activated"
          : "Category deactivated"
      );

      await loadCategories(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Could not update category status"
      );
    }
  };

  const toggleFeatured = async (category) => {
    try {
      await updateCategory(category._id, {
        featured: !category.featured,
      });

      toast.success(
        category.featured
          ? "Removed from featured"
          : "Marked as featured"
      );

      await loadCategories(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Could not update featured status"
      );
    }
  };

  const toggleExpanded = (id) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const expandAll = () => {
    setExpanded(
      new Set(allCategories.map((category) => category._id))
    );
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const visibleMainCount = filteredTree.length;
  const visibleSubCount = Math.max(
    0,
    flattenCategories(filteredTree).length - visibleMainCount
  );

  return (
    <div className="min-h-full bg-slate-50/60 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <FolderTree size={14} />
              Catalog Management
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Categories
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage your Odikart categories, subcategories, images,
              featured sections and catalog order.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadCategories(true)}
              disabled={refreshing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:flex-none"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 sm:flex-none"
            >
              <Plus size={17} />
              Add Category
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Total", stats.total, FolderTree],
            ["Active", stats.active, Check],
            ["Inactive", stats.inactive, Power],
            ["Featured", stats.featured, Star],
            ["Products", stats.products, Package],
          ].map(([label, value, Icon]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <Icon size={17} className="text-slate-400" />
              </div>

              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </section>

        {/* Main Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["inactive", "Inactive"],
                ["featured", "Featured"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    filter === value
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="hidden h-7 w-px bg-slate-200 lg:block" />

              <button
                type="button"
                onClick={expandAll}
                className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:block"
              >
                Expand
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:block"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={22} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Couldn't load categories
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => loadCategories(true)}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Layers3 size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                {search || filter !== "all"
                  ? "No matching categories"
                  : "No categories yet"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {search || filter !== "all"
                  ? "Try another search term or filter."
                  : "Create your first category to start organizing products."}
              </p>

              {!search && filter === "all" && (
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Create Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop column header */}
              <div className="hidden bg-slate-50/80 px-5 py-3 md:grid md:grid-cols-[minmax(300px,1.8fr)_100px_100px_110px_210px] md:items-center md:gap-4">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Category
                </span>

                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Products
                </span>

                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Order
                </span>

                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Status
                </span>

                <span className="text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                  Actions
                </span>
              </div>

              {filteredTree.map((category) => (
                <CategoryRow
                  key={category._id}
                  category={category}
                  expanded={expanded}
                  onToggle={toggleExpanded}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onStatus={toggleStatus}
                  onFeatured={toggleFeatured}
                  onAddSubcategory={openCreate}
                />
              ))}

              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {visibleMainCount}
                </span>{" "}
                main categor{visibleMainCount === 1 ? "y" : "ies"} and{" "}
                <span className="font-semibold text-slate-700">
                  {visibleSubCount}
                </span>{" "}
                subcategor{visibleSubCount === 1 ? "y" : "ies"}.
              </div>
            </>
          )}
        </section>
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={submitCategory}
        form={form}
        setForm={setForm}
        editing={editing}
        submitting={submitting}
        parents={parentCategories}
      />

      <DeleteModal
        category={deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
