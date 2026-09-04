import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Mail,
  Phone,
  MapPin,
  Home,
  Navigation,
  Contact,
  ShoppingBag,
  IndianRupee,
  Heart,
  Star,
  Clock,
  X,
  Filter,
  UserRound,
  Store,
  AlertTriangle,
  Check,
  CircleDot,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";

import adminApi from "../../services/adminApi";

const PAGE_SIZE = 10;

const Users = () => {
  // ==========================================
  // STATE
  // ==========================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [verificationFilter, setVerificationFilter] =
    useState("all");

  const [sellerStatusFilter, setSellerStatusFilter] =
    useState("all");

  const [showFilters, setShowFilters] =
    useState(false);

  const [sortBy, setSortBy] =
    useState("newest");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedUsers, setSelectedUsers] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [openMenu, setOpenMenu] =
    useState(null);

  const [userAddresses, setUserAddresses] =
    useState([]);

  const [addressLoading, setAddressLoading] =
    useState(false);

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await adminApi.get(
          "/auth/user"
        );

      const data =
        response.data;

      let fetchedUsers = [];

      if (Array.isArray(data)) {
        fetchedUsers = data;
      } else if (
        Array.isArray(data?.users)
      ) {
        fetchedUsers = data.users;
      } else if (
        Array.isArray(data?.data)
      ) {
        fetchedUsers = data.data;
      } else if (
        Array.isArray(data?.results)
      ) {
        fetchedUsers = data.results;
      }

      setUsers(fetchedUsers);
    } catch (err) {
      console.error(
        "Failed to fetch users:",
        err
      );

      const message =
        err.response?.data?.message ||
        "Failed to load users";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // NORMALIZE USER
  // ==========================================

  const normalizeUser = (user) => {
    const fullName =
      user.name ||
      user.fullName ||
      `${user.firstName || ""} ${
        user.lastName || ""
      }`.trim() ||
      "Unknown User";

    const role =
      user.role ||
      "customer";

    const status =
      user.status ||
      (user.isBlocked
        ? "blocked"
        : user.isSuspended
        ? "suspended"
        : "active");

    const emailVerified =
      user.emailVerified ??
      user.isEmailVerified ??
      user.emailVerifiedAt != null ??
      false;

    const phoneVerified =
      user.phoneVerified ??
      user.isPhoneVerified ??
      user.phoneVerifiedAt != null ??
      false;

    const sellerStatus =
      user.sellerStatus ||
      "not_seller";

    const totalOrders =
      user.totalOrders ??
      user.orderCount ??
      user.ordersCount ??
      0;

    const totalSpent =
      user.totalSpent ??
      user.totalPurchase ??
      user.totalAmountSpent ??
      0;

    const wishlistCount =
      user.wishlistCount ??
      user.wishlist?.length ??
      0;

    const reviewCount =
      user.reviewCount ??
      user.reviews?.length ??
      0;

    const createdAt =
      user.createdAt ||
      user.created_at ||
      user.registeredAt;

    const lastLogin =
      user.lastLogin ||
      user.lastLoginAt;

    return {
      ...user,
      _id:
        user._id ||
        user.id ||
        user.userId,

      fullName,

      role,

      status,

      emailVerified:
        Boolean(emailVerified),

      phoneVerified:
        Boolean(phoneVerified),

      sellerStatus,

      totalOrders:
        Number(totalOrders) || 0,

      totalSpent:
        Number(totalSpent) || 0,

      wishlistCount:
        Number(wishlistCount) || 0,

      reviewCount:
        Number(reviewCount) || 0,

      createdAt,

      lastLogin,
    };
  };

  // ==========================================
  // NORMALIZED USERS
  // ==========================================

  const normalizedUsers = useMemo(() => {
    return users.map(normalizeUser);
  }, [users]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    const total =
      normalizedUsers.length;

    const active =
      normalizedUsers.filter(
        (user) =>
          user.status === "active"
      ).length;

    const suspended =
      normalizedUsers.filter(
        (user) =>
          user.status === "suspended"
      ).length;

    const blocked =
      normalizedUsers.filter(
        (user) =>
          user.status === "blocked"
      ).length;

    const sellers =
      normalizedUsers.filter(
        (user) =>
          user.role === "seller"
      ).length;

    const verified =
      normalizedUsers.filter(
        (user) =>
          user.emailVerified &&
          user.phoneVerified
      ).length;

    return {
      total,
      active,
      suspended,
      blocked,
      sellers,
      verified,
    };
  }, [normalizedUsers]);

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredUsers = useMemo(() => {
    let result = [
      ...normalizedUsers,
    ];

    // Search
    if (search.trim()) {
      const query =
        search
          .toLowerCase()
          .trim();

      result = result.filter(
        (user) => {
          return (
            user.fullName
              ?.toLowerCase()
              .includes(query) ||
            user.email
              ?.toLowerCase()
              .includes(query) ||
            user.phone
              ?.toLowerCase()
              .includes(query) ||
            user.username
              ?.toLowerCase()
              .includes(query) ||
            String(user._id)
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }

    // Role
    if (
      roleFilter !== "all"
    ) {
      result = result.filter(
        (user) =>
          user.role === roleFilter
      );
    }

    // Status
    if (
      statusFilter !== "all"
    ) {
      result = result.filter(
        (user) =>
          user.status ===
          statusFilter
      );
    }

    // Verification
    if (
      verificationFilter !==
      "all"
    ) {
      result = result.filter(
        (user) => {
          if (
            verificationFilter ===
            "verified"
          ) {
            return (
              user.emailVerified &&
              user.phoneVerified
            );
          }

          if (
            verificationFilter ===
            "email_verified"
          ) {
            return user.emailVerified;
          }

          if (
            verificationFilter ===
            "phone_verified"
          ) {
            return user.phoneVerified;
          }

          if (
            verificationFilter ===
            "unverified"
          ) {
            return (
              !user.emailVerified ||
              !user.phoneVerified
            );
          }

          return true;
        }
      );
    }

    // Seller status
    if (
      sellerStatusFilter !==
      "all"
    ) {
      result = result.filter(
        (user) =>
          user.sellerStatus ===
          sellerStatusFilter
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(
              a.createdAt || 0
            ) -
            new Date(
              b.createdAt || 0
            )
          );

        case "name":
          return a.fullName.localeCompare(
            b.fullName
          );

        case "orders":
          return (
            b.totalOrders -
            a.totalOrders
          );

        case "spent":
          return (
            b.totalSpent -
            a.totalSpent
          );

        case "newest":
        default:
          return (
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
          );
      }
    });

    return result;
  }, [
    normalizedUsers,
    search,
    roleFilter,
    statusFilter,
    verificationFilter,
    sellerStatusFilter,
    sortBy,
  ]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length /
          PAGE_SIZE
      )
    );

  const paginatedUsers =
    filteredUsers.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage *
        PAGE_SIZE
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    roleFilter,
    statusFilter,
    verificationFilter,
    sellerStatusFilter,
    sortBy,
  ]);

  // ==========================================
  // SELECTION
  // ==========================================

  const toggleSelectUser = (
    id
  ) => {
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pageIds =
      paginatedUsers.map(
        (user) => user._id
      );

    const allSelected =
      pageIds.every((id) =>
        selectedUsers.includes(id)
      );

    if (allSelected) {
      setSelectedUsers((prev) =>
        prev.filter(
          (id) =>
            !pageIds.includes(id)
        )
      );
    } else {
      setSelectedUsers((prev) => [
        ...new Set([
          ...prev,
          ...pageIds,
        ]),
      ]);
    }
  };

  const allPageSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every(
      (user) =>
        selectedUsers.includes(
          user._id
        )
    );

  // ==========================================
  // FETCH USER ADDRESSES
  // ==========================================

  const fetchUserAddresses = async (userId) => {
    if (!userId) {
      setUserAddresses([]);
      return;
    }

    try {
      setAddressLoading(true);

      const response = await adminApi.get(
        `/users/${userId}/addresses`
      );

      const data = response.data;

      setUserAddresses(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.addresses)
          ? data.addresses
          : Array.isArray(data?.data)
          ? data.data
          : []
      );
    } catch (err) {
      setUserAddresses([]);
      toast.error(
        err.response?.data?.message ||
          "Failed to load user addresses"
      );
    } finally {
      setAddressLoading(false);
    }
  };

  // ==========================================
  // OPEN USER
  // ==========================================

  const openUser = (user) => {
    setSelectedUser(user);
    setUserAddresses([]);
    setDrawerOpen(true);
    setOpenMenu(null);
    fetchUserAddresses(user?._id);
  };

  // ==========================================
  // USER ACTION
  // ==========================================

  const performAction = async (
    user,
    action
  ) => {
    if (!user?._id) {
      toast.error(
        "User ID not found"
      );
      return;
    }

    try {
      setActionLoading(true);

      let endpoint = "";

      let method = "put";

      switch (action) {
        case "suspend":
          endpoint = `/admin/users/${user._id}/suspend`;
          break;

        case "activate":
          endpoint = `/admin/users/${user._id}/activate`;
          break;

        case "block":
          endpoint = `/admin/users/${user._id}/block`;
          break;

        case "unblock":
          endpoint = `/admin/users/${user._id}/unblock`;
          break;

        case "delete":
          endpoint = `/admin/users/${user._id}`;
          method = "delete";
          break;

        default:
          return;
      }

      await adminApi({
        method,
        url: endpoint,
      });

      toast.success(
        `User ${
          action === "delete"
            ? "deleted"
            : action
        } successfully`
      );

      setDrawerOpen(false);
      setSelectedUser(null);

      await fetchUsers(true);
    } catch (err) {
      console.error(
        `Failed to ${action} user:`,
        err
      );

      toast.error(
        err.response?.data
          ?.message ||
          `Failed to ${action} user`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // BULK ACTION
  // ==========================================

  const bulkAction = async (
    action
  ) => {
    if (
      selectedUsers.length === 0
    ) {
      toast.error(
        "Select at least one user"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await adminApi.post(
        "/admin/users/bulk-action",
        {
          userIds:
            selectedUsers,
          action,
        }
      );

      toast.success(
        "Bulk action completed"
      );

      setSelectedUsers([]);

      await fetchUsers(true);
    } catch (err) {
      console.error(
        "Bulk action failed:",
        err
      );

      toast.error(
        err.response?.data
          ?.message ||
          "Bulk action failed"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // EXPORT CSV
  // ==========================================

  const exportCSV = () => {
    if (
      filteredUsers.length === 0
    ) {
      toast.error(
        "No users to export"
      );
      return;
    }

    const headers = [
      "User ID",
      "Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Email Verified",
      "Phone Verified",
      "Seller Status",
      "Orders",
      "Total Spent",
      "Joined",
    ];

    const rows =
      filteredUsers.map(
        (user) => [
          user._id || "",
          user.fullName || "",
          user.email || "",
          user.phone || "",
          user.role || "",
          user.status || "",
          user.emailVerified
            ? "Yes"
            : "No",
          user.phoneVerified
            ? "Yes"
            : "No",
          user.sellerStatus ||
            "",
          user.totalOrders,
          user.totalSpent,
          formatDate(
            user.createdAt
          ),
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(
              value
            ).replaceAll(
              '"',
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `odikart-users-${Date.now()}.csv`;

    link.click();

    URL.revokeObjectURL(url);

    toast.success(
      "Users exported successfully"
    );
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) return "—";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "—";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatCurrency = (
    value
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  };

  const getInitials = (
    name
  ) => {
    return (
      name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
          (word) =>
            word[0]
        )
        .join("")
        .toUpperCase() ||
      "U"
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-11 h-11 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading users...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    error &&
    users.length === 0
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">

        <div className="max-w-md text-center">

          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle
              className="text-red-500"
              size={28}
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Unable to load users
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() =>
              fetchUsers()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
            />
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-full space-y-6 pb-10 text-slate-900">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-950/15 ring-1 ring-black/5">
              <UsersIcon
                size={21}
                className="text-white"
              />
            </div>

            <div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Users
              </h1>

              <p className="text-sm text-slate-500 mt-1.5">
                Manage customers, sellers and platform users.
              </p>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={() =>
              fetchUsers(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>

          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
          >

            <Download
              size={16}
            />

            Export

          </button>

        </div>

      </div>

      {/* ======================================
          STATS
      ====================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4">

        <StatCard
          title="Total Users"
          value={stats.total}
          icon={UsersIcon}
        />

        <StatCard
          title="Active"
          value={stats.active}
          icon={UserCheck}
        />

        <StatCard
          title="Sellers"
          value={stats.sellers}
          icon={Store}
        />

        <StatCard
          title="Verified"
          value={stats.verified}
          icon={ShieldCheck}
        />

        <StatCard
          title="Suspended"
          value={stats.suspended}
          icon={ShieldAlert}
        />

        <StatCard
          title="Blocked"
          value={stats.blocked}
          icon={UserX}
        />

      </div>

      {/* ======================================
          SEARCH + FILTERS
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">

        <div className="p-4 flex flex-col xl:flex-row gap-3 bg-white">

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by name, email, phone or user ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
            />

          </div>

          {/* Role */}

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
          >
            <option value="all">
              All Roles
            </option>
            <option value="customer">
              Customers
            </option>
            <option value="seller">
              Sellers
            </option>
            <option value="admin">
              Admins
            </option>
            <option value="staff">
              Staff
            </option>
            <option value="delivery">
              Delivery
            </option>
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
          >
            <option value="all">
              All Status
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="suspended">
              Suspended
            </option>
            <option value="blocked">
              Blocked
            </option>
          </select>

          {/* More filters */}

          <button
            onClick={() =>
              setShowFilters(
                !showFilters
              )
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
              showFilters
                ? "border-slate-900 bg-slate-950 text-white shadow-md shadow-slate-950/15"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >

            <Filter
              size={16}
            />

            Filters

          </button>

        </div>

        {/* Advanced filters */}

        {showFilters && (
          <div className="border-t border-slate-100 p-4">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <div>

                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Verification
                </label>

                <select
                  value={
                    verificationFilter
                  }
                  onChange={(e) =>
                    setVerificationFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                >
                  <option value="all">
                    All
                  </option>

                  <option value="verified">
                    Fully Verified
                  </option>

                  <option value="email_verified">
                    Email Verified
                  </option>

                  <option value="phone_verified">
                    Phone Verified
                  </option>

                  <option value="unverified">
                    Unverified
                  </option>
                </select>

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Seller Status
                </label>

                <select
                  value={
                    sellerStatusFilter
                  }
                  onChange={(e) =>
                    setSellerStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                >
                  <option value="all">
                    All
                  </option>

                  <option value="not_seller">
                    Not Seller
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>

                  <option value="suspended">
                    Suspended
                  </option>
                </select>

              </div>

              <div>

                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Sort By
                </label>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                >
                  <option value="newest">
                    Newest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>

                  <option value="name">
                    Name
                  </option>

                  <option value="orders">
                    Most Orders
                  </option>

                  <option value="spent">
                    Highest Spending
                  </option>
                </select>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ======================================
          BULK BAR
      ====================================== */}

      {selectedUsers.length >
        0 && (
        <div className="sticky top-3 z-20 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-3 sm:p-4 shadow-2xl shadow-slate-950/20 ring-1 ring-white/10 backdrop-blur">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Check
                  size={16}
                />
              </div>

              <span className="text-sm font-semibold">
                {selectedUsers.length}{" "}
                user
                {selectedUsers.length !==
                1
                  ? "s"
                  : ""}{" "}
                selected
              </span>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  bulkAction(
                    "activate"
                  )
                }
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
              >
                Activate
              </button>

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  bulkAction(
                    "suspend"
                  )
                }
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
              >
                Suspend
              </button>

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  bulkAction(
                    "block"
                  )
                }
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
              >
                Block
              </button>

              <button
                onClick={() =>
                  setSelectedUsers(
                    []
                  )
                }
                className="rounded-lg bg-white text-slate-950 px-3 py-2 text-xs font-semibold"
              >
                Clear
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================
          USERS TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">

        {/* Desktop */}

        <div className="hidden lg:block overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur">

              <tr>

                <th className="w-12 px-4 py-4 text-left">

                  <input
                    type="checkbox"
                    checked={
                      allPageSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                    className="w-4 h-4 rounded border-slate-300"
                  />

                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  User
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Role
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Orders
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Spent
                </th>

                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Joined
                </th>

                <th className="px-4 py-4"></th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {paginatedUsers.length ===
              0 ? (
                <tr>

                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >

                    <UsersIcon
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your filters.
                    </p>

                  </td>

                </tr>
              ) : (
                paginatedUsers.map(
                  (user) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      selectedUsers={
                        selectedUsers
                      }
                      toggleSelectUser={
                        toggleSelectUser
                      }
                      openUser={
                        openUser
                      }
                      openMenu={
                        openMenu
                      }
                      setOpenMenu={
                        setOpenMenu
                      }
                      performAction={
                        performAction
                      }
                      actionLoading={
                        actionLoading
                      }
                      getInitials={
                        getInitials
                      }
                      formatDate={
                        formatDate
                      }
                      formatCurrency={
                        formatCurrency
                      }
                    />
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* Mobile / Tablet */}

        <div className="lg:hidden divide-y divide-slate-100">

          {paginatedUsers.length ===
          0 ? (
            <div className="px-6 py-16 text-center">

              <UsersIcon
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                No users found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your filters.
              </p>

            </div>
          ) : (
            paginatedUsers.map(
              (user) => (
                <UserMobileCard
                  key={user._id}
                  user={user}
                  selectedUsers={
                    selectedUsers
                  }
                  toggleSelectUser={
                    toggleSelectUser
                  }
                  openUser={
                    openUser
                  }
                  openMenu={
                    openMenu
                  }
                  setOpenMenu={
                    setOpenMenu
                  }
                  performAction={
                    performAction
                  }
                  actionLoading={
                    actionLoading
                  }
                  getInitials={
                    getInitials
                  }
                  formatDate={
                    formatDate
                  }
                  formatCurrency={
                    formatCurrency
                  }
                />
              )
            )
          )}

        </div>

        {/* ==================================
            PAGINATION
        ================================== */}

        <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <p className="text-sm text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-700">
              {filteredUsers.length ===
              0
                ? 0
                : (currentPage - 1) *
                    PAGE_SIZE +
                  1}
            </span>

            {" – "}

            <span className="font-semibold text-slate-700">
              {Math.min(
                currentPage *
                  PAGE_SIZE,
                filteredUsers.length
              )}
            </span>

            {" of "}

            <span className="font-semibold text-slate-700">
              {filteredUsers.length}
            </span>

            {" users"}

          </p>

          <div className="flex items-center gap-1">

            <button
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            {Array.from(
              {
                length: Math.min(
                  totalPages,
                  5
                ),
              },
              (_, index) => {
                let page =
                  index + 1;

                if (
                  totalPages > 5
                ) {
                  if (
                    currentPage >
                    3
                  ) {
                    page =
                      currentPage -
                      2 +
                      index;

                    if (
                      page >
                      totalPages
                    ) {
                      page =
                        totalPages -
                        4 +
                        index;
                    }
                  }
                }

                return (
                  <button
                    key={page}
                    onClick={() =>
                      setCurrentPage(
                        page
                      )
                    }
                    className={`w-9 h-9 rounded-lg text-sm font-semibold ${
                      currentPage ===
                      page
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
            )}

            <button
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight
                size={17}
              />
            </button>

          </div>

        </div>

      </div>

      {/* ======================================
          USER DRAWER
      ====================================== */}

      {drawerOpen &&
        selectedUser && (
          <UserDetailsDrawer
            user={selectedUser}
            onClose={() => {
              setDrawerOpen(false);
              setSelectedUser(null);
              setUserAddresses([]);
            }}
            performAction={
              performAction
            }
            actionLoading={
              actionLoading
            }
            getInitials={
              getInitials
            }
            formatDate={
              formatDate
            }
            formatCurrency={
              formatCurrency
            }
            addresses={userAddresses}
            addressLoading={addressLoading}
          />
        )}

    </div>
  );
};

// ======================================================
// STAT CARD
// ======================================================

const StatCard = ({
  title,
  value,
  icon: Icon,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-950">
            {value.toLocaleString(
              "en-IN"
            )}
          </p>

        </div>

        <div className="w-10 h-10 rounded-xl bg-slate-100 ring-1 ring-slate-200/70 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">

          <Icon
            size={19}
            className="text-slate-700"
          />

        </div>

      </div>

    </div>
  );
};

// ======================================================
// ROLE BADGE
// ======================================================

const RoleBadge = ({
  role,
}) => {
  const config = {
    admin: {
      label: "Admin",
      className:
        "bg-purple-50 text-purple-700 border-purple-100",
    },

    seller: {
      label: "Seller",
      className:
        "bg-blue-50 text-blue-700 border-blue-100",
    },

    staff: {
      label: "Staff",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
    },

    delivery: {
      label: "Delivery",
      className:
        "bg-cyan-50 text-cyan-700 border-cyan-100",
    },

    customer: {
      label: "Customer",
      className:
        "bg-slate-50 text-slate-700 border-slate-200",
    },
  };

  const item =
    config[role] ||
    config.customer;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({
  status,
}) => {
  const config = {
    active: {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-500",
    },

    inactive: {
      label: "Inactive",
      className:
        "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
    },

    suspended: {
      label: "Suspended",
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
    },

    blocked: {
      label: "Blocked",
      className:
        "bg-red-50 text-red-700 border-red-100",
      dot: "bg-red-500",
    },

    pending: {
      label: "Pending",
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-100",
      dot: "bg-yellow-500",
    },
  };

  const item =
    config[status] ||
    config.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${item.dot}`}
      />

      {item.label}
    </span>
  );
};

// ======================================================
// VERIFICATION BADGE
// ======================================================

const VerificationBadge = ({
  user,
}) => {
  const verified =
    user.emailVerified &&
    user.phoneVerified;

  return (
    <div className="space-y-1">

      {verified ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <ShieldCheck
            size={14}
          />
          Verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
          <ShieldAlert
            size={14}
          />
          Unverified
        </span>
      )}

      <div className="flex gap-1.5 text-[10px]">

        <span
          className={
            user.emailVerified
              ? "text-emerald-600"
              : "text-slate-400"
          }
        >
          Email
        </span>

        <span className="text-slate-300">
          •
        </span>

        <span
          className={
            user.phoneVerified
              ? "text-emerald-600"
              : "text-slate-400"
          }
        >
          Phone
        </span>

      </div>

    </div>
  );
};

// ======================================================
// USER TABLE ROW
// ======================================================

const UserTableRow = ({
  user,
  selectedUsers,
  toggleSelectUser,
  openUser,
  openMenu,
  setOpenMenu,
  performAction,
  actionLoading,
  getInitials,
  formatDate,
  formatCurrency,
}) => {
  return (
    <tr className="group transition-colors hover:bg-slate-50/80">

      <td className="px-4 py-4">

        <input
          type="checkbox"
          checked={selectedUsers.includes(
            user._id
          )}
          onChange={() =>
            toggleSelectUser(
              user._id
            )
          }
          className="w-4 h-4 rounded border-slate-300"
        />

      </td>

      <td className="px-4 py-4">

        <button
          onClick={() =>
            openUser(user)
          }
          className="flex items-center gap-3 text-left"
        >

          <Avatar
            user={user}
            getInitials={
              getInitials
            }
          />

          <div className="min-w-0">

            <p className="font-semibold text-sm text-slate-900 truncate max-w-[180px]">
              {user.fullName}
            </p>

            <p className="text-xs text-slate-500 truncate max-w-[180px]">
              {user.email ||
                "No email"}
            </p>

          </div>

        </button>

      </td>

      <td className="px-4 py-4">

        <RoleBadge
          role={user.role}
        />

      </td>

      <td className="px-4 py-4">

        <StatusBadge
          status={user.status}
        />

      </td>

      <td className="px-4 py-4">

        <VerificationBadge
          user={user}
        />

      </td>

      <td className="px-4 py-4">

        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">

          <ShoppingBag
            size={15}
            className="text-slate-400"
          />

          {user.totalOrders}

        </div>

      </td>

      <td className="px-4 py-4">

        <p className="text-sm font-semibold text-slate-800">
          {formatCurrency(
            user.totalSpent
          )}
        </p>

      </td>

      <td className="px-4 py-4">

        <p className="text-xs text-slate-500">
          {formatDate(
            user.createdAt
          )}
        </p>

      </td>

      <td className="px-4 py-4">

        <div className="relative">

          <button
            onClick={() =>
              setOpenMenu(
                openMenu ===
                  user._id
                  ? null
                  : user._id
              )
            }
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:bg-slate-100/80"
          >
            <MoreVertical
              size={18}
            />
          </button>

          {openMenu ===
            user._id && (
            <ActionMenu
              user={user}
              openUser={
                openUser
              }
              performAction={
                performAction
              }
              actionLoading={
                actionLoading
              }
            />
          )}

        </div>

      </td>

    </tr>
  );
};

// ======================================================
// MOBILE USER CARD
// ======================================================

const UserMobileCard = ({
  user,
  selectedUsers,
  toggleSelectUser,
  openUser,
  openMenu,
  setOpenMenu,
  performAction,
  actionLoading,
  getInitials,
  formatDate,
  formatCurrency,
}) => {
  return (
    <div className="p-4">

      <div className="flex items-start gap-3">

        <input
          type="checkbox"
          checked={selectedUsers.includes(
            user._id
          )}
          onChange={() =>
            toggleSelectUser(
              user._id
            )
          }
          className="mt-2 w-4 h-4 rounded border-slate-300"
        />

        <button
          onClick={() =>
            openUser(user)
          }
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >

          <Avatar
            user={user}
            getInitials={
              getInitials
            }
          />

          <div className="min-w-0">

            <p className="font-semibold text-sm text-slate-900 truncate">
              {user.fullName}
            </p>

            <p className="text-xs text-slate-500 truncate">
              {user.email ||
                user.phone ||
                "No contact"}
            </p>

          </div>

        </button>

        <div className="relative">

          <button
            onClick={() =>
              setOpenMenu(
                openMenu ===
                  user._id
                  ? null
                  : user._id
              )
            }
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:bg-slate-100/80"
          >
            <MoreVertical
              size={18}
            />
          </button>

          {openMenu ===
            user._id && (
            <ActionMenu
              user={user}
              openUser={
                openUser
              }
              performAction={
                performAction
              }
              actionLoading={
                actionLoading
              }
            />
          )}

        </div>

      </div>

      <div className="mt-4 flex flex-wrap gap-2 pl-7">

        <RoleBadge
          role={user.role}
        />

        <StatusBadge
          status={user.status}
        />

        {user.emailVerified &&
          user.phoneVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck
                size={13}
              />
              Verified
            </span>
          )}

      </div>

      <div className="mt-4 ml-7 grid grid-cols-3 gap-2">

        <MiniStat
          icon={ShoppingBag}
          label="Orders"
          value={
            user.totalOrders
          }
        />

        <MiniStat
          icon={IndianRupee}
          label="Spent"
          value={formatCurrency(
            user.totalSpent
          )}
        />

        <MiniStat
          icon={Heart}
          label="Wishlist"
          value={
            user.wishlistCount
          }
        />

      </div>

      <div className="mt-3 ml-7 flex items-center gap-1.5 text-xs text-slate-400">

        <Clock
          size={13}
        />

        Joined{" "}
        {formatDate(
          user.createdAt
        )}

      </div>

    </div>
  );
};

// ======================================================
// AVATAR
// ======================================================

const Avatar = ({
  user,
  getInitials,
}) => {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName}
        className="w-10 h-10 rounded-xl object-cover shrink-0"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">

      <span className="text-xs font-bold text-slate-700">
        {getInitials(
          user.fullName
        )}
      </span>

    </div>
  );
};

// ======================================================
// MINI STAT
// ======================================================

const MiniStat = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-1.5 text-slate-400">

        <Icon
          size={13}
        />

        <span className="text-[10px] font-semibold">
          {label}
        </span>

      </div>

      <p className="mt-1 text-xs font-bold text-slate-800 truncate">
        {value}
      </p>

    </div>
  );
};

// ======================================================
// ACTION MENU
// ======================================================

const ActionMenu = ({
  user,
  openUser,
  performAction,
  actionLoading,
}) => {
  return (
    <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5">

      <button
        onClick={() =>
          openUser(user)
        }
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
      >
        <Eye size={16} />
        View Profile
      </button>

      <div className="h-px bg-slate-100 my-1" />

      {user.status ===
        "suspended" ||
      user.status ===
        "blocked" ? (
        <button
          disabled={
            actionLoading
          }
          onClick={() =>
            performAction(
              user,
              user.status ===
                "blocked"
                ? "unblock"
                : "activate"
            )
          }
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          <CheckCircle2
            size={16}
          />
          Activate
        </button>
      ) : (
        <button
          disabled={
            actionLoading
          }
          onClick={() =>
            performAction(
              user,
              "suspend"
            )
          }
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          <Ban size={16} />
          Suspend
        </button>
      )}

      <button
        disabled={
          actionLoading
        }
        onClick={() =>
          performAction(
            user,
            user.status ===
              "blocked"
              ? "unblock"
              : "block"
          )
        }
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <ShieldAlert
          size={16}
        />
        {user.status ===
        "blocked"
          ? "Unblock"
          : "Block"}
      </button>

      <button
        disabled={
          actionLoading
        }
        onClick={() =>
          performAction(
            user,
            "delete"
          )
        }
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={16} />
        Delete User
      </button>

    </div>
  );
};

// ======================================================
// USER DETAILS DRAWER
// ======================================================

const UserDetailsDrawer = ({
  user,
  onClose,
  performAction,
  actionLoading,
  getInitials,
  formatDate,
  formatCurrency,
  addresses = [],
  addressLoading = false,
}) => {
  return (
    <div className="fixed inset-0 z-[100]">

      {/* Overlay */}

      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      {/* Drawer */}

      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-xl overflow-y-auto bg-slate-50/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl ring-1 ring-black/5">

        {/* Header */}

        <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-5 py-4 flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              User Profile
            </p>

            <h2 className="text-lg font-bold text-slate-950">
              User Details
            </h2>

          </div>

          <button
            onClick={onClose}
            aria-label="Close user details"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-500"
          >
            <X size={19} />
          </button>

        </div>

        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">

          {/* Profile */}

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-xl shadow-slate-950/15">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-lg flex items-center justify-center overflow-hidden">

                {user.avatar ? (
                  <img
                    src={
                      user.avatar
                    }
                    alt={
                      user.fullName
                    }
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {getInitials(
                      user.fullName
                    )}
                  </span>
                )}

              </div>

              <div className="min-w-0">

                <h3 className="text-xl font-bold truncate">
                  {user.fullName}
                </h3>

                <p className="text-sm text-slate-400 truncate">
                  {user.email ||
                    "No email"}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">

                  <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                    {user.role}
                  </span>

                  <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
                    {user.status}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* Stats */}

          <div className="grid grid-cols-2 gap-3">

            <DrawerStat
              icon={ShoppingBag}
              label="Orders"
              value={
                user.totalOrders
              }
            />

            <DrawerStat
              icon={IndianRupee}
              label="Total Spent"
              value={formatCurrency(
                user.totalSpent
              )}
            />

            <DrawerStat
              icon={Heart}
              label="Wishlist"
              value={
                user.wishlistCount
              }
            />

            <DrawerStat
              icon={Star}
              label="Reviews"
              value={
                user.reviewCount
              }
            />

          </div>

          {/* Contact */}

          <Section title="Contact Information">

            <InfoRow
              icon={Mail}
              label="Email"
              value={
                user.email ||
                "Not provided"
              }
              verified={
                user.emailVerified
              }
            />

            <InfoRow
              icon={Phone}
              label="Phone"
              value={
                user.phone ||
                "Not provided"
              }
              verified={
                user.phoneVerified
              }
            />

          </Section>

          {/* Location */}

          <Section title="Location">

            <InfoRow
              icon={MapPin}
              label="Location"
              value={
                user.city ||
                user.address?.city ||
                user.location ||
                "Not provided"
              }
            />

            <InfoRow
              icon={MapPin}
              label="State"
              value={
                user.state ||
                user.address?.state ||
                "Not provided"
              }
            />

          </Section>

          {/* Addresses */}

          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Saved Addresses
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {addresses.length} saved address
                  {addresses.length !== 1 ? "es" : ""}
                </p>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Contact
                  size={17}
                  className="text-slate-600"
                />
              </div>
            </div>

            {addressLoading ? (
              <div className="rounded-2xl border border-slate-200 p-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <Home
                  size={25}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  No saved addresses
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  This user has not added an address yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address, index) => {
                  const locationParts = [
                    address.area,
                    address.village,
                    address.city,
                    address.district,
                    address.state,
                    address.postalCode,
                  ].filter(Boolean);

                  return (
                    <div
                      key={
                        address._id ||
                        `${address.postalCode}-${index}`
                      }
                      className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
                        address.isDefault
                          ? "border-slate-900/20 bg-slate-50 ring-1 ring-slate-900/5"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Home
                              size={16}
                              className="text-slate-600"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {address.label || "Home"}
                              </p>

                              {address.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                                  <Check size={10} />
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5">
                              {address.fullName ||
                                user.fullName ||
                                "—"}
                            </p>
                          </div>
                        </div>

                        {address.location?.latitude != null &&
                          address.location?.longitude != null && (
                            <span
                              title={`${address.location.latitude}, ${address.location.longitude}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 shrink-0"
                            >
                              <Navigation size={11} />
                              GPS
                            </span>
                          )}
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-slate-700 leading-5">
                          {[
                            address.addressLine1,
                            address.addressLine2,
                            address.landmark
                              ? `Near ${address.landmark}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address not provided"}
                        </p>

                        <p className="text-sm text-slate-600 leading-5">
                          {locationParts.length
                            ? locationParts.join(", ")
                            : "Location not provided"}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                          {address.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} />
                              {address.phone}
                            </span>
                          )}

                          {address.alternatePhone && (
                            <span>
                              Alt: {address.alternatePhone}
                            </span>
                          )}

                          {address.country && (
                            <span>
                              {address.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Account */}

          <Section title="Account Information">

            <InfoRow
              icon={UserRound}
              label="User ID"
              value={
                user._id ||
                "—"
              }
            />

            <InfoRow
              icon={Clock}
              label="Joined"
              value={formatDate(
                user.createdAt
              )}
            />

            <InfoRow
              icon={Clock}
              label="Last Login"
              value={formatDate(
                user.lastLogin
              )}
            />

          </Section>

          {/* Seller */}

          {user.role ===
            "seller" && (
            <Section title="Seller Information">

              <InfoRow
                icon={Store}
                label="Seller Status"
                value={
                  user.sellerStatus
                }
              />

              <InfoRow
                icon={ShieldCheck}
                label="Documents"
                value={
                  user.documentsVerified
                    ? "Verified"
                    : "Not verified"
                }
              />

            </Section>
          )}

          {/* Actions */}

          <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:shadow-md">

            <p className="text-sm font-bold text-slate-900 mb-3">
              Account Actions
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              {user.status ===
                "suspended" ||
              user.status ===
                "blocked" ? (
                <button
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    performAction(
                      user,
                      user.status ===
                        "blocked"
                        ? "unblock"
                        : "activate"
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50"
                >
                  <CheckCircle2
                    size={16}
                  />
                  Activate
                </button>
              ) : (
                <button
                  disabled={
                    actionLoading
                  }
                  onClick={() =>
                    performAction(
                      user,
                      "suspend"
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 text-amber-700 px-4 py-3 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50"
                >
                  <Ban size={16} />
                  Suspend
                </button>
              )}

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  performAction(
                    user,
                    user.status ===
                      "blocked"
                      ? "unblock"
                      : "block"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                <ShieldAlert
                  size={16}
                />
                {user.status ===
                "blocked"
                  ? "Unblock"
                  : "Block"}
              </button>

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  performAction(
                    user,
                    "delete"
                  )
                }
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}

                Delete Account
              </button>

            </div>

          </div>

        </div>

      </aside>

    </div>
  );
};

// ======================================================
// DRAWER STAT
// ======================================================

const DrawerStat = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:shadow-md">

      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">

        <Icon
          size={17}
          className="text-slate-600"
        />

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
};

// ======================================================
// SECTION
// ======================================================

const Section = ({
  title,
  children,
}) => {
  return (
    <section>

      <h3 className="text-sm font-bold text-slate-900 mb-3">
        {title}
      </h3>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 shadow-sm shadow-slate-200/30">

        {children}

      </div>

    </section>
  );
};

// ======================================================
// INFO ROW
// ======================================================

const InfoRow = ({
  icon: Icon,
  label,
  value,
  verified,
}) => {
  return (
    <div className="p-3.5 flex items-center gap-3 transition-colors hover:bg-slate-50/70">

      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">

        <Icon
          size={15}
          className="text-slate-500"
        />

      </div>

      <div className="min-w-0 flex-1">

        <p className="text-[11px] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-medium text-slate-700 truncate">
          {value}
        </p>

      </div>

      {verified && (
        <CheckCircle2
          size={16}
          className="text-emerald-500 shrink-0"
        />
      )}

    </div>
  );
};

export default Users;