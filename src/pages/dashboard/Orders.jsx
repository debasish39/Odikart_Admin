import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  Package,
  Truck,
  User,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  IndianRupee,
  CalendarDays,
  Hash,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Box,
  ShieldCheck,
  Ban,
  MapPinned,
  Navigation,
  Database,
  Receipt,
  Store,
  Wallet,
  Tag,
  Globe,
  Home,
  Copy,
  Check,
  CircleDollarSign,
  AlertTriangle,
  Layers,
  UserRound,
  KeyRound,
} from "lucide-react";

import toast from "react-hot-toast";

import adminApi from "../../services/adminApi";

import {
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  assignCourier,
  updateTracking,
  approveReturn,
  rejectReturn,
  assignReturnCourier,
  returnPickedUp,
  receiveReturnedProduct,
  inspectReturnedProduct,
  completeRefund,
} from "../../services/orderApi";


/* =========================================================
   ORDER STATUS FLOW
========================================================= */

const STATUS_FLOW = {
  "Pending Payment": [
    "Confirmed",
    "Cancelled",
  ],

  Confirmed: [
    "Processing",
    "Cancelled",
  ],

  Processing: [
    "Packed",
    "Cancelled",
  ],

  Packed: [
    "Ready for Pickup",
    "Cancelled",
  ],

  "Ready for Pickup": [
    "Shipped",
  ],

  Shipped: [
    "In Transit",
  ],

  "In Transit": [
    "Out for Delivery",
  ],

  "Out for Delivery": [
    "Delivered",
  ],

  Delivered: [
    "Return Requested",
  ],

  "Return Requested": [
    "Return Approved",
    "Return Rejected",
  ],

  "Return Approved": [
    "Return Pickup Scheduled",
  ],

  "Return Pickup Scheduled": [
    "Return Picked Up",
  ],

  "Return Picked Up": [
    "Received by Admin",
  ],

  "Received by Admin": [
    "Inspection",
  ],

  Inspection: [
    "Refund Processing",
    "Return Rejected",
  ],

  "Refund Processing": [
    "Refund Completed",
  ],

  "Refund Completed": [],
  "Return Rejected": [],
  Cancelled: [],
};


const ALL_STATUSES = [
  "Pending Payment",
  "Confirmed",
  "Processing",
  "Packed",
  "Ready for Pickup",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Return Requested",
  "Return Approved",
  "Return Pickup Scheduled",
  "Return Picked Up",
  "Received by Admin",
  "Inspection",
  "Refund Processing",
  "Refund Completed",
  "Return Rejected",
  "Cancelled",
];


/* =========================================================
   SAFE HELPERS
========================================================= */

const money = (value) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


const formatDate = (date) => {
  if (!date) return "—";

  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};


const formatDateTime = (date) => {
  if (!date) return "—";

  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};


/*
  IMPORTANT:
  MongoDB ObjectId may arrive as:
  "6a9868ff..."
  OR
  { $oid: "6a9868ff..." }

  This helper prevents React from trying to render
  an object directly.
*/
const stringifyId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.$oid) {
      return String(value.$oid);
    }

    if (value._id) {
      return stringifyId(value._id);
    }

    if (typeof value.toString === "function") {
      const result = value.toString();

      if (result !== "[object Object]") {
        return result;
      }
    }
  }

  return "";
};


/*
  UNIVERSAL DISPLAY HELPER

  Prevents:
  "Objects are not valid as a React child"
*/
const displayValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(displayValue)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.$oid) {
      return String(value.$oid);
    }

    if (value.fullName) {
      return String(value.fullName);
    }

    if (value.name) {
      return String(value.name);
    }

    if (value.label) {
      return String(value.label);
    }

    if (value.value) {
      return String(value.value);
    }

    if (value.addressLine1) {
      return [
        value.addressLine1,
        value.addressLine2,
        value.area,
        value.landmark,
        value.city,
        value.district,
        value.state,
        value.postalCode,
        value.country,
      ]
        .map(displayValue)
        .filter(Boolean)
        .join(", ");
    }

    if (value.address) {
      return displayValue(value.address);
    }

    return Object.entries(value)
      .filter(([key]) => key !== "_id")
      .map(([, val]) => displayValue(val))
      .filter(Boolean)
      .join(", ");
  }

  return String(value);
};


/* =========================================================
   CUSTOMER
========================================================= */

const getCustomerName = (order) => {
  const user = order?.userId;

  const orderName =
    order?.fullname ||
    order?.fullName;

  if (orderName) {
    return String(orderName);
  }

  if (
    user &&
    typeof user === "object"
  ) {
    const name = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      name ||
      user.fullName ||
      user.name ||
      user.email ||
      "Customer"
    );
  }

  return order?.email || "Customer";
};


const getCustomerEmail = (order) => {
  return (
    order?.email ||
    order?.userId?.email ||
    order?.deliveryAddress?.customer?.email ||
    ""
  );
};


const getCustomerPhone = (order) => {
  return (
    order?.phone ||
    order?.userId?.phone ||
    order?.deliveryAddress?.customer?.phone ||
    ""
  );
};


/* =========================================================
   PRODUCT HELPERS
========================================================= */

const getItems = (order) => {
  return Array.isArray(order?.items)
    ? order.items
    : [];
};


const getProductObject = (item) => {
  if (
    item?.productId &&
    typeof item.productId === "object"
  ) {
    return item.productId;
  }

  return null;
};


const getProductId = (item) => {
  const product = getProductObject(item);

  return (
    stringifyId(
      product?._id
    ) ||
    stringifyId(item?.productId) ||
    ""
  );
};


const getProductTitle = (item) => {
  return (
    item?.title ||
    getProductObject(item)?.title ||
    "Product"
  );
};


const getProductImages = (item) => {
  const product = getProductObject(item);

  const images = [];

  /*
    Order item image
  */
  if (item?.image) {
    images.push(item.image);
  }

  /*
    Product thumbnail
  */
  if (product?.thumbnail) {
    images.push(product.thumbnail);
  }

  /*
    Product images array
  */
  if (Array.isArray(product?.images)) {
    images.push(
      ...product.images
    );
  }

  /*
    Product images object
  */
  if (
    product?.images &&
    typeof product.images === "object" &&
    !Array.isArray(product.images)
  ) {
    images.push(
      ...Object.values(product.images)
        .filter(
          (image) =>
            typeof image === "string"
        )
    );
  }

  return [
    ...new Set(
      images.filter(Boolean)
    ),
  ];
};


const getProductImage = (item) => {
  return (
    getProductImages(item)[0] ||
    ""
  );
};


const getProductBrand = (item) => {
  return (
    item?.brand ||
    getProductObject(item)?.brand ||
    ""
  );
};


const getProductCategory = (item) => {
  const category =
    item?.category ||
    getProductObject(item)?.category;

  return displayValue(category);
};


const getProductSlug = (item) => {
  return (
    item?.slug ||
    getProductObject(item)?.slug ||
    ""
  );
};


const getSellerId = (item) => {
  return (
    stringifyId(
      item?.sellerId
    ) ||
    stringifyId(
      getProductObject(item)?.sellerId
    ) ||
    ""
  );
};


/* =========================================================
   ORDER HELPERS
========================================================= */

const getOrderTotal = (order) => {
  return Number(
    order?.pricing?.total ??
    order?.totalAmount ??
    order?.total ??
    0
  );
};


const getPaymentStatus = (order) => {
  return (
    order?.payment?.status ||
    order?.paymentStatus ||
    "Unknown"
  );
};


const getPaymentMethod = (order) => {
  return (
    order?.payment?.method ||
    order?.paymentMethod ||
    "Unknown"
  );
};


const getShipping = (order) => {
  return (
    order?.shipping &&
    typeof order.shipping === "object"
      ? order.shipping
      : {}
  );
};


/* =========================================================
   ADDRESS HELPERS
========================================================= */

const getAddress = (order) => {
  const delivery =
    order?.deliveryAddress;

  if (!delivery) {
    return {};
  }

  /*
    Your exact schema:

    deliveryAddress: {
      customer: {...},
      address: {...},
      location: {...},
      preference: {...}
    }
  */

  if (
    delivery.address &&
    typeof delivery.address === "object"
  ) {
    return delivery.address;
  }

  /*
    Backward compatibility
  */
  return delivery;
};


const getAddressLines = (order) => {
  const address =
    getAddress(order);

  return [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map(displayValue)
    .filter(Boolean);
};


const getAddressText = (order) => {
  return (
    getAddressLines(order).join(", ") ||
    "Address not available"
  );
};


/* =========================================================
   STATUS STYLE
========================================================= */

const getStatusClass = (status) => {
  const value = String(
    status || ""
  ).toLowerCase();

  if (
    value.includes("delivered") ||
    value.includes("completed") ||
    value.includes("approved")
  ) {
    return "bg-black text-white border-black";
  }

  if (
    value.includes("cancel") ||
    value.includes("reject")
  ) {
    return "bg-white text-black border-black";
  }

  if (
    value.includes("return") ||
    value.includes("refund")
  ) {
    return "bg-neutral-200 text-black border-neutral-400";
  }

  if (
    value.includes("pending") ||
    value.includes("processing")
  ) {
    return "bg-neutral-100 text-black border-neutral-300";
  }

  return "bg-white text-black border-neutral-300";
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Orders() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState("All");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("All");

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    showStatusMenu,
    setShowStatusMenu,
  ] = useState(false);

  const [couriers, setCouriers] = useState([]);

  const [couriersLoading, setCouriersLoading] = useState(false);

  const [courierModal, setCourierModal] = useState({
    open: false,
    mode: "outbound",
  });

  const [
    page,
    setPage,
  ] = useState(1);

  const pageSize = 10;


  /* =========================================================
     LOAD COURIERS
  ========================================================= */

  const loadCouriers = async () => {
    try {
      setCouriersLoading(true);

      const response = await adminApi.get("/couriers");
      const data = response?.data;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load couriers");
      }

      const availableCouriers = (
        Array.isArray(data.couriers) ? data.couriers : []
      ).filter(
        (courier) =>
          courier?.isActive === true &&
          courier?.verificationStatus === "verified" &&
          courier?.status === "available"
      );

      setCouriers(availableCouriers);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load couriers"
      );
    } finally {
      setCouriersLoading(false);
    }
  };

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  const loadOrders = async (
    silent = false
  ) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data =
        await getAdminOrders();

      if (!data?.success) {
        throw new Error(
          data?.message ||
          "Failed to load orders"
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadOrders();
    loadCouriers();
  }, []);


  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    const query =
      search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (order) => {
          const searchable = [
            order?.orderNumber,
            order?.fullname,
            order?.fullName,
            order?.email,
            order?.phone,
            getCustomerName(order),
            getCustomerEmail(order),
            getCustomerPhone(order),
            order?.status,
          ]
            .map(displayValue)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (order) =>
          order?.status ===
          statusFilter
      );
    }

    if (paymentFilter !== "All") {
      result = result.filter(
        (order) =>
          getPaymentStatus(order) ===
          paymentFilter
      );
    }

    if (dateFilter !== "All") {
      const now = new Date();

      let startDate =
        new Date(now);

      if (dateFilter === "Today") {
        startDate.setHours(
          0,
          0,
          0,
          0
        );
      }

      if (dateFilter === "7 Days") {
        startDate.setDate(
          now.getDate() - 7
        );
      }

      if (dateFilter === "30 Days") {
        startDate.setDate(
          now.getDate() - 30
        );
      }

      result = result.filter(
        (order) =>
          new Date(
            order.createdAt
          ) >= startDate
      );
    }

    return result;
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
    dateFilter,
  ]);


  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
        pageSize
      )
    );

  const paginatedOrders =
    filteredOrders.slice(
      (page - 1) * pageSize,
      page * pageSize
    );


  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    paymentFilter,
    dateFilter,
  ]);


  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total =
      orders.length;

    const pending =
      orders.filter(
        (o) =>
          o.status ===
          "Pending Payment"
      ).length;

    const processing =
      orders.filter(
        (o) =>
          [
            "Confirmed",
            "Processing",
            "Packed",
            "Ready for Pickup",
            "Shipped",
            "In Transit",
            "Out for Delivery",
          ].includes(o.status)
      ).length;

    const delivered =
      orders.filter(
        (o) =>
          o.status ===
          "Delivered"
      ).length;

    const returns =
      orders.filter(
        (o) =>
          String(
            o.status || ""
          )
            .toLowerCase()
            .includes("return") ||
          String(
            o.status || ""
          )
            .toLowerCase()
            .includes("refund")
      ).length;

    const cancelled =
      orders.filter(
        (o) =>
          o.status ===
          "Cancelled"
      ).length;

    const revenue =
      orders.reduce(
        (sum, order) => {
          if (
            [
              "Cancelled",
              "Refund Completed",
            ].includes(
              order.status
            )
          ) {
            return sum;
          }

          return (
            sum +
            getOrderTotal(order)
          );
        },
        0
      );

    return {
      total,
      pending,
      processing,
      delivered,
      returns,
      cancelled,
      revenue,
    };
  }, [orders]);


  /* =========================================================
     OPEN ORDER
  ========================================================= */

  const openOrder = async (order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);

    try {
      const data =
        await getAdminOrder(
          order._id
        );

      if (
        data?.success &&
        data.order
      ) {
        setSelectedOrder(
          data.order
        );
      }
    } catch (error) {
      /*
        Keep already-loaded order
        if detail API fails.
      */
    } finally {
      setDetailsLoading(false);
    }
  };


  /* =========================================================
     REFRESH SELECTED ORDER
  ========================================================= */

  const refreshSelectedOrder =
    async (id) => {
      try {
        const data =
          await getAdminOrder(id);

        if (data?.success) {
          setSelectedOrder(
            data.order
          );

          setOrders((prev) =>
            prev.map(
              (order) =>
                String(
                  order._id
                ) === String(id)
                  ? data.order
                  : order
            )
          );
        }
      } catch (error) {
      }
    };


  /* =========================================================
     STATUS UPDATE
  ========================================================= */

  const handleStatusUpdate =
    async (status) => {
      if (!selectedOrder) return;

      const remark =
        window.prompt(
          `Remark for "${status}" (optional):`,
          ""
        );

      try {
        setActionLoading(true);

        const data =
          await updateOrderStatus(
            selectedOrder._id,
            status,
            remark || ""
          );

        if (!data?.success) {
          throw new Error(
            data?.message ||
            "Status update failed"
          );
        }

        toast.success(
          "Order status updated"
        );

        await refreshSelectedOrder(
          selectedOrder._id
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to update order"
        );
      } finally {
        setActionLoading(false);
      }
    };


  /* =========================================================
     ASSIGN COURIER
  ========================================================= */

  const handleAssignCourier = () => {
    if (!selectedOrder) {
      toast.error("Please select an order first");
      return;
    }

    if (selectedOrder.status !== "Ready for Pickup") {
      toast.error(
        'Courier can be assigned only when the order is "Ready for Pickup".'
      );
      return;
    }

    setCourierModal({ open: true, mode: "outbound" });
  };

  const submitCourierAssignment = async ({
    courierId,
    trackingNumber,
    estimatedDelivery,
    mode,
  }) => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);

      const data =
        mode === "return"
          ? await assignReturnCourier(
              selectedOrder._id,
              courierId,
              trackingNumber,
              estimatedDelivery
                ? new Date(estimatedDelivery)
                : undefined
            )
          : await assignCourier(
              selectedOrder._id,
              courierId,
              trackingNumber,
              estimatedDelivery
                ? new Date(estimatedDelivery)
                : undefined
            );

      if (!data?.success) {
        throw new Error(
          data?.message ||
          (mode === "return"
            ? "Return courier assignment failed"
            : "Courier assignment failed")
        );
      }

      toast.success(
        mode === "return"
          ? "Return courier assigned"
          : "Courier assigned"
      );

      setCourierModal({ open: false, mode: "outbound" });
      await refreshSelectedOrder(selectedOrder._id);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Courier assignment failed"
      );
    } finally {
      setActionLoading(false);
    }
  };



  /* =========================================================
     TRACKING
  ========================================================= */

  const handleTracking = async () => {
    if (!selectedOrder) return;

    const shipping =
      getShipping(
        selectedOrder
      );

    const trackingNumber =
      window.prompt(
        "Tracking Number:",
        shipping.trackingNumber || ""
      );

    if (!trackingNumber) return;

    const trackingUrl =
      window.prompt(
        "Tracking URL:",
        shipping.trackingUrl || ""
      );

    try {
      setActionLoading(true);

      const data =
        await updateTracking(
          selectedOrder._id,
          trackingNumber,
          trackingUrl || ""
        );

      if (!data?.success) {
        throw new Error(
          data?.message ||
          "Tracking update failed"
        );
      }

      toast.success(
        "Tracking updated"
      );

      await refreshSelectedOrder(
        selectedOrder._id
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Tracking update failed"
      );
    } finally {
      setActionLoading(false);
    }
  };


  /* =========================================================
     RETURN ACTION
  ========================================================= */

  const handleReturnAction =
    async (action) => {
      if (!selectedOrder) return;

      try {
        setActionLoading(true);

        let data;

        if (action === "approve") {
          const remark =
            window.prompt(
              "Return approval remark:",
              ""
            );

          data =
            await approveReturn(
              selectedOrder._id,
              remark || ""
            );
        }

        if (action === "reject") {
          const remark =
            window.prompt(
              "Return rejection reason:",
              ""
            );

          if (!remark) {
            toast.error(
              "Rejection reason is required"
            );

            return;
          }

          data =
            await rejectReturn(
              selectedOrder._id,
              remark
            );
        }

        if (!data?.success) {
          throw new Error(
            data?.message ||
            "Return action failed"
          );
        }

        toast.success(
          data.message ||
          "Return updated"
        );

        await refreshSelectedOrder(
          selectedOrder._id
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Return action failed"
        );
      } finally {
        setActionLoading(false);
      }
    };


  /* =========================================================
     RETURN COURIER
  ========================================================= */

  const handleReturnCourier = () => {
    if (!selectedOrder) return;
    setCourierModal({ open: true, mode: "return" });
  };



  /* =========================================================
     RETURN PICKED
  ========================================================= */

  const handleReturnPicked =
    async () => {
      if (!selectedOrder) return;

      try {
        setActionLoading(true);

        const data =
          await returnPickedUp(
            selectedOrder._id
          );

        if (!data?.success) {
          throw new Error(
            data?.message ||
            "Unable to update return"
          );
        }

        toast.success(
          "Return pickup completed"
        );

        await refreshSelectedOrder(
          selectedOrder._id
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to update return"
        );
      } finally {
        setActionLoading(false);
      }
    };


  /* =========================================================
     RECEIVE RETURN
  ========================================================= */

  const handleReceiveReturn =
    async () => {
      if (!selectedOrder) return;

      try {
        setActionLoading(true);

        const data =
          await receiveReturnedProduct(
            selectedOrder._id
          );

        if (!data?.success) {
          throw new Error(
            data?.message ||
            "Unable to receive return"
          );
        }

        toast.success(
          "Returned product received"
        );

        await refreshSelectedOrder(
          selectedOrder._id
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to receive return"
        );
      } finally {
        setActionLoading(false);
      }
    };


  /* =========================================================
     INSPECTION
  ========================================================= */

  const handleInspection =
    async (
      inspectionStatus
    ) => {
      if (!selectedOrder) return;

      const remark =
        window.prompt(
          "Inspection remark:",
          ""
        );

      try {
        setActionLoading(true);

        const data =
          await inspectReturnedProduct(
            selectedOrder._id,
            inspectionStatus,
            remark || ""
          );

        if (!data?.success) {
          throw new Error(
            data?.message ||
            "Inspection failed"
          );
        }

        toast.success(
          "Inspection completed"
        );

        await refreshSelectedOrder(
          selectedOrder._id
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Inspection failed"
        );
      } finally {
        setActionLoading(false);
      }
    };


  /* =========================================================
     REFUND
  ========================================================= */

  const handleRefund = async () => {
    if (!selectedOrder) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to complete this refund?"
      );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const data =
        await completeRefund(
          selectedOrder._id
        );

      if (!data?.success) {
        throw new Error(
          data?.message ||
          "Refund failed"
        );
      }

      toast.success(
        "Refund completed"
      );

      await refreshSelectedOrder(
        selectedOrder._id
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Refund failed"
      );
    } finally {
      setActionLoading(false);
    }
  };


  /* =========================================================
     COPY
  ========================================================= */

  const copyValue = async (
    value,
    label = "Value"
  ) => {
    const text =
      displayValue(value);

    if (!text) return;

    try {
      await navigator.clipboard.writeText(
        text
      );

      toast.success(
        `${label} copied`
      );
    } catch {
      toast.error(
        "Unable to copy"
      );
    }
  };


  /* =========================================================
     CSV EXPORT
  ========================================================= */

  const exportCSV = () => {
    if (!filteredOrders.length) {
      toast.error(
        "No orders to export"
      );

      return;
    }

    const headers = [
      "Order Number",
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Status",
      "Payment Method",
      "Payment Status",
      "Subtotal",
      "Tax",
      "Shipping",
      "Coupon Discount",
      "Total",
      "Created At",
    ];

    const rows =
      filteredOrders.map(
        (order) => [
          order.orderNumber || "",
          stringifyId(
            order._id
          ),
          getCustomerName(order),
          getCustomerEmail(order),
          getCustomerPhone(order),
          order.status || "",
          getPaymentMethod(order),
          getPaymentStatus(order),
          order?.pricing?.subtotal || 0,
          order?.pricing?.tax || 0,
          order?.pricing?.shippingCharge || 0,
          order?.pricing?.couponDiscount || 0,
          getOrderTotal(order),
          formatDateTime(
            order.createdAt
          ),
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value)
                .replace(
                  /"/g,
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
      document.createElement("a");

    link.href = url;

    link.download =
      `odikart-orders-${Date.now()}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success(
      "Orders exported"
    );
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={34}
            className="animate-spin"
          />

          <p className="text-sm font-medium">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }


  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-white text-black">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-neutral-200">

        <div className="px-4 sm:px-6 lg:px-8 py-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <Package size={24} />

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Orders
                </h1>

              </div>

              <p className="text-sm text-neutral-500 mt-1">
                Manage every Odikart order from one place.
              </p>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                onClick={() =>
                  loadOrders(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 transition disabled:opacity-50"
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
                onClick={exportCSV}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition"
              >

                <Download size={16} />

                Export CSV

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="px-4 sm:px-6 lg:px-8 py-5">

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

          <StatCard
            label="Total Orders"
            value={stats.total}
            icon={<Package size={18} />}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<Clock size={18} />}
          />

          <StatCard
            label="Processing"
            value={stats.processing}
            icon={<Box size={18} />}
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon={<CheckCircle2 size={18} />}
          />

          <StatCard
            label="Returns"
            value={stats.returns}
            icon={<RotateCcw size={18} />}
          />

          <StatCard
            label="Revenue"
            value={money(stats.revenue)}
            icon={<IndianRupee size={18} />}
          />

        </div>

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="px-4 sm:px-6 lg:px-8 pb-5">

        <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">

          <div className="flex flex-col lg:flex-row gap-3">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search order, customer, email, phone..."
                className="w-full h-11 rounded-xl border border-neutral-300 pl-10 pr-4 text-sm outline-none focus:border-black transition"
              />

            </div>


            <div className="hidden md:flex gap-2">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm font-medium bg-white outline-none"
              >

                <option value="All">
                  All Statuses
                </option>

                {ALL_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

              </select>


              <select
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm font-medium bg-white outline-none"
              >

                <option value="All">
                  All Payments
                </option>

                <option value="Paid">
                  Paid
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Refunded">
                  Refunded
                </option>

              </select>


              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm font-medium bg-white outline-none"
              >

                <option value="All">
                  All Dates
                </option>

                <option value="Today">
                  Today
                </option>

                <option value="7 Days">
                  Last 7 Days
                </option>

                <option value="30 Days">
                  Last 30 Days
                </option>

              </select>

            </div>


            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className="md:hidden h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold"
            >
              Filters
            </button>

          </div>


          {showFilters && (
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm bg-white"
              >

                <option value="All">
                  All Statuses
                </option>

                {ALL_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

              </select>


              <select
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm bg-white"
              >

                <option value="All">
                  All Payments
                </option>

                <option value="Paid">
                  Paid
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Refunded">
                  Refunded
                </option>

              </select>


              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-neutral-300 px-3 text-sm bg-white"
              >

                <option value="All">
                  All Dates
                </option>

                <option value="Today">
                  Today
                </option>

                <option value="7 Days">
                  Last 7 Days
                </option>

                <option value="30 Days">
                  Last 30 Days
                </option>

              </select>

            </div>
          )}

        </div>

      </div>


      {/* =====================================================
          RESULT COUNT
      ===================================================== */}

      <div className="px-4 sm:px-6 lg:px-8 pb-3">

        <div className="flex items-center justify-between">

          <p className="text-sm text-neutral-500">

            Showing{" "}

            <span className="font-semibold text-black">
              {filteredOrders.length}
            </span>{" "}

            orders

          </p>


          {(search ||
            statusFilter !== "All" ||
            paymentFilter !== "All" ||
            dateFilter !== "All") && (

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPaymentFilter("All");
                setDateFilter("All");
              }}
              className="text-sm font-semibold underline"
            >
              Clear filters
            </button>

          )}

        </div>

      </div>


      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="hidden lg:block px-4 sm:px-6 lg:px-8 pb-8">

        <div className="border border-neutral-200 rounded-2xl overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-neutral-50 border-b border-neutral-200">

                <tr>

                  <th className="text-left px-5 py-4 font-semibold">
                    Order
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Customer
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Items
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Payment
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Total
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="text-right px-5 py-4 font-semibold">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {paginatedOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="py-20 text-center"
                    >

                      <Package
                        size={40}
                        className="mx-auto text-neutral-300"
                      />

                      <p className="font-semibold mt-3">
                        No orders found
                      </p>

                      <p className="text-sm text-neutral-500 mt-1">
                        Try changing your filters.
                      </p>

                    </td>

                  </tr>

                ) : (

                  paginatedOrders.map(
                    (order) => (

                      <tr
                        key={stringifyId(order._id)}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition"
                      >

                        <td className="px-5 py-4">

                          <div className="font-bold">
                            #
                            {order.orderNumber ||
                              stringifyId(
                                order._id
                              ).slice(-8)}
                          </div>

                          <div className="text-xs text-neutral-500 mt-1">
                            {formatDate(
                              order.createdAt
                            )}
                          </div>

                        </td>


                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <Avatar
                              src={
                                order?.userId?.image
                              }
                              name={getCustomerName(
                                order
                              )}
                            />

                            <div className="min-w-0">

                              <p className="font-semibold truncate max-w-[180px]">
                                {getCustomerName(
                                  order
                                )}
                              </p>

                              <p className="text-xs text-neutral-500 truncate max-w-[180px]">
                                {getCustomerEmail(
                                  order
                                )}
                              </p>

                            </div>

                          </div>

                        </td>


                        <td className="px-5 py-4">

                          <div className="font-semibold">
                            {getItems(order).length}{" "}
                            product
                            {getItems(order).length !==
                            1
                              ? "s"
                              : ""}
                          </div>

                          <div className="text-xs text-neutral-500">

                            {getItems(order).reduce(
                              (
                                sum,
                                item
                              ) =>
                                sum +
                                Number(
                                  item.quantity || 0
                                ),
                              0
                            )}{" "}
                            units

                          </div>

                        </td>


                        <td className="px-5 py-4">

                          <p className="font-medium">
                            {getPaymentMethod(
                              order
                            )}
                          </p>

                          <p className="text-xs text-neutral-500">
                            {getPaymentStatus(
                              order
                            )}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <p className="font-bold">
                            {money(
                              getOrderTotal(
                                order
                              )
                            )}
                          </p>

                        </td>


                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {displayValue(
                              order.status
                            )}
                          </span>

                        </td>


                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              openOrder(order)
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 font-semibold hover:bg-black hover:text-white hover:border-black transition"
                          >
                            <Eye size={15} />
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* =====================================================
          MOBILE ORDERS
      ===================================================== */}

      <div className="lg:hidden px-4 sm:px-6 pb-8">

        <div className="space-y-3">

          {paginatedOrders.length === 0 ? (

            <div className="border border-neutral-200 rounded-2xl py-16 text-center">

              <Package
                size={40}
                className="mx-auto text-neutral-300"
              />

              <p className="font-semibold mt-3">
                No orders found
              </p>

            </div>

          ) : (

            paginatedOrders.map(
              (order) => (

                <button
                  key={stringifyId(order._id)}
                  onClick={() =>
                    openOrder(order)
                  }
                  className="w-full text-left border border-neutral-200 rounded-2xl p-4 hover:border-black transition bg-white"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="font-bold">
                        #
                        {order.orderNumber ||
                          stringifyId(
                            order._id
                          ).slice(-8)}
                      </p>

                      <p className="text-xs text-neutral-500 mt-1">
                        {formatDateTime(
                          order.createdAt
                        )}
                      </p>

                    </div>


                    <span
                      className={`shrink-0 inline-flex px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {displayValue(
                        order.status
                      )}
                    </span>

                  </div>


                  <div className="flex items-center gap-3 mt-4">

                    <Avatar
                      src={
                        order?.userId?.image
                      }
                      name={getCustomerName(
                        order
                      )}
                    />

                    <div className="min-w-0 flex-1">

                      <p className="font-semibold truncate">
                        {getCustomerName(
                          order
                        )}
                      </p>

                      <p className="text-xs text-neutral-500 truncate">
                        {getCustomerEmail(
                          order
                        )}
                      </p>

                    </div>

                    <ChevronRight
                      size={18}
                      className="text-neutral-400"
                    />

                  </div>


                  <div className="grid grid-cols-3 gap-2 mt-4">

                    <MiniStat
                      label="Items"
                      value={
                        getItems(order).length
                      }
                    />

                    <MiniStat
                      label="Payment"
                      value={getPaymentStatus(
                        order
                      )}
                    />

                    <MiniStat
                      label="Total"
                      value={money(
                        getOrderTotal(
                          order
                        )
                      )}
                    />

                  </div>

                </button>

              )
            )

          )}

        </div>

      </div>


      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {filteredOrders.length > 0 && (

        <div className="px-4 sm:px-6 lg:px-8 pb-8">

          <div className="flex items-center justify-between gap-3">

            <p className="text-sm text-neutral-500">
              Page {page} of{" "}
              {totalPages}
            </p>


            <div className="flex gap-2">

              <button
                disabled={page === 1}
                onClick={() =>
                  setPage(
                    (p) =>
                      Math.max(
                        1,
                        p - 1
                      )
                  )
                }
                className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>


              <button
                disabled={
                  page === totalPages
                }
                onClick={() =>
                  setPage(
                    (p) =>
                      Math.min(
                        totalPages,
                        p + 1
                      )
                  )
                }
                className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          ORDER DRAWER
      ===================================================== */}

      {selectedOrder && (

        <OrderDrawer
          order={selectedOrder}
          loading={detailsLoading}
          actionLoading={actionLoading}
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusUpdate={
            handleStatusUpdate
          }
          onAssignCourier={
            handleAssignCourier
          }
          onTracking={
            handleTracking
          }
          onReturnAction={
            handleReturnAction
          }
          onReturnCourier={
            handleReturnCourier
          }
          onReturnPicked={
            handleReturnPicked
          }
          onReceiveReturn={
            handleReceiveReturn
          }
          onInspection={
            handleInspection
          }
          onRefund={
            handleRefund
          }
          onCopy={
            copyValue
          }
          showStatusMenu={
            showStatusMenu
          }
          setShowStatusMenu={
            setShowStatusMenu
          }
        />
      )}

      {courierModal.open && (
        <CourierAssignmentModal
          couriers={couriers}
          loading={couriersLoading}
          submitting={actionLoading}
          mode={courierModal.mode}
          currentCourier={getShipping(selectedOrder)?.courier}
          currentCourierName={getShipping(selectedOrder)?.courierName}
          onClose={() =>
            !actionLoading &&
            setCourierModal({ open: false, mode: "outbound" })
          }
          onSubmit={submitCourierAssignment}
        />
      )}

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4 bg-white">

      <div className="flex items-center justify-between">

        <span className="text-neutral-500">
          {icon}
        </span>

        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
          Odikart
        </span>

      </div>

      <p className="text-xs text-neutral-500 mt-4">
        {label}
      </p>

      <p className="text-xl font-bold mt-1">
        {displayValue(value)}
      </p>

    </div>
  );
}


/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">

      <p className="text-[10px] uppercase text-neutral-500 font-semibold">
        {label}
      </p>

      <p className="font-bold mt-1 truncate">
        {displayValue(value)}
      </p>

    </div>
  );
}


/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  src,
  name,
}) {
  const initials =
    String(name || "U")
      .split(" ")
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-neutral-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  );
}


/* =========================================================
   ORDER DRAWER
========================================================= */

function OrderDrawer({
  order,
  loading,
  actionLoading,
  onClose,
  onStatusUpdate,
  onAssignCourier,
  onTracking,
  onReturnAction,
  onReturnCourier,
  onReturnPicked,
  onReceiveReturn,
  onInspection,
  onRefund,
  onCopy,
  showStatusMenu,
  setShowStatusMenu,
}) {
  const items =
    getItems(order);

  const shipping =
    getShipping(order);

  const deliveryAddress =
    order?.deliveryAddress ||
    {};

  const customer =
    order?.userId &&
    typeof order.userId === "object"
      ? order.userId
      : {};

  const nextStatuses =
    STATUS_FLOW[
      order?.status
    ] || [];

  const address =
    getAddress(order);

  const location =
    deliveryAddress?.location ||
    {};

  const preference =
    deliveryAddress?.preference ||
    {};

  const pricing =
    order?.pricing ||
    {};

  const marketplace =
    order?.marketplace ||
    {};

  const payment =
    order?.payment ||
    {};

  const gateway =
    payment?.gateway ||
    {};

  const refund =
    order?.refund ||
    {};

  const cancellation =
    order?.cancellation ||
    {};

  const stock =
    order?.stock ||
    {};

  return (
    <div className="fixed inset-0 z-50">

      {/* BACKDROP */}

      <button
        aria-label="Close order drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />


      {/* DRAWER */}

      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-xl lg:max-w-3xl bg-white shadow-2xl flex flex-col">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="shrink-0 border-b border-neutral-200 px-4 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <Hash size={18} />

                <h2 className="font-bold text-lg truncate">
                  {order?.orderNumber ||
                    stringifyId(
                      order?._id
                    )}
                </h2>

                <button
                  onClick={() =>
                    onCopy(
                      order?.orderNumber ||
                        stringifyId(
                          order?._id
                        ),
                      "Order number"
                    )
                  }
                  className="p-1.5 rounded-lg hover:bg-neutral-100"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>

              </div>

              <p className="text-xs text-neutral-500 mt-1">
                {formatDateTime(
                  order?.createdAt
                )}
              </p>

            </div>


            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-black hover:text-white transition"
            >
              <X size={18} />
            </button>

          </div>


          <div className="flex items-center justify-between mt-4 gap-3">

            <span
              className={`inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                order?.status
              )}`}
            >
              {displayValue(
                order?.status
              )}
            </span>


            <div className="relative">

              <button
                onClick={() =>
                  setShowStatusMenu(
                    !showStatusMenu
                  )
                }
                disabled={
                  actionLoading ||
                  !nextStatuses.length
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40"
              >
                Update Status

                <ChevronDown
                  size={14}
                />

              </button>


              {showStatusMenu &&
                nextStatuses.length >
                  0 && (

                  <div className="absolute right-0 top-11 z-30 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">

                    <div className="px-3 py-2 border-b border-neutral-100 text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                      Allowed next status
                    </div>

                    {nextStatuses.map(
                      (status) => (

                        <button
                          key={status}
                          onClick={() => {
                            setShowStatusMenu(
                              false
                            );

                            onStatusUpdate(
                              status
                            );
                          }}
                          className="w-full text-left px-3 py-3 text-sm font-semibold hover:bg-neutral-100"
                        >
                          {status}
                        </button>

                      )
                    )}

                  </div>

                )}

            </div>

          </div>

        </div>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="flex-1 overflow-y-auto">

          {loading && (

            <div className="flex items-center justify-center py-4 border-b border-neutral-100">

              <Loader2
                size={18}
                className="animate-spin"
              />

              <span className="text-xs ml-2">
                Refreshing order...
              </span>

            </div>

          )}


          <div className="p-4 sm:p-6 space-y-7">


            {/* =================================================
                ORDER INFORMATION
            ================================================= */}

            <Section
              title="Order Information"
              icon={<Receipt size={17} />}
            >

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <InfoBox
                  label="Order Number"
                  value={
                    order?.orderNumber
                  }
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="Order ID"
                  value={stringifyId(
                    order?._id
                  )}
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="User ID"
                  value={stringifyId(
                    order?.userId
                  )}
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="Created"
                  value={formatDateTime(
                    order?.createdAt
                  )}
                />

                <InfoBox
                  label="Updated"
                  value={formatDateTime(
                    order?.updatedAt
                  )}
                />

                <InfoBox
                  label="Seller Name"
                  value={
                    order?.sellerName ||
                    "—"
                  }
                />

              </div>

            </Section>


            {/* =================================================
                CUSTOMER
            ================================================= */}

            <Section
              title="Customer"
              icon={<User size={17} />}
            >

              <div className="rounded-2xl border border-neutral-200 p-4">

                <div className="flex items-center gap-4">

                  <Avatar
                    src={
                      customer?.image
                    }
                    name={getCustomerName(
                      order
                    )}
                  />

                  <div className="min-w-0">

                    <p className="font-bold text-base">
                      {getCustomerName(
                        order
                      )}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">

                      {getCustomerEmail(
                        order
                      ) && (

                        <span className="flex items-center gap-1 break-all">

                          <Mail size={12} />

                          {getCustomerEmail(
                            order
                          )}

                        </span>

                      )}


                      {getCustomerPhone(
                        order
                      ) && (

                        <span className="flex items-center gap-1">

                          <Phone size={12} />

                          {getCustomerPhone(
                            order
                          )}

                        </span>

                      )}

                    </div>

                  </div>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

                  <InfoBox
                    label="First Name"
                    value={
                      customer?.firstName ||
                      ""
                    }
                  />

                  <InfoBox
                    label="Last Name"
                    value={
                      customer?.lastName ||
                      ""
                    }
                  />

                  <InfoBox
                    label="Email"
                    value={
                      getCustomerEmail(
                        order
                      )
                    }
                  />

                  <InfoBox
                    label="Phone"
                    value={
                      getCustomerPhone(
                        order
                      )
                    }
                  />

                  <InfoBox
                    label="Order Customer Name"
                    value={
                      order?.fullname
                    }
                  />

                  <InfoBox
                    label="Delivery Customer Name"
                    value={
                      deliveryAddress?.customer
                        ?.fullName
                    }
                  />

                </div>

              </div>

            </Section>


            {/* =================================================
                PRODUCTS
            ================================================= */}

            <Section
              title={`Products (${items.length})`}
              icon={<Package size={17} />}
            >

              <div className="space-y-4">

                {items.map(
                  (item, index) => {

                    const images =
                      getProductImages(
                        item
                      );

                    const image =
                      images[0] ||
                      "";

                    const product =
                      getProductObject(
                        item
                      );

                    const quantity =
                      Number(
                        item?.quantity ||
                        0
                      );

                    const price =
                      Number(
                        item?.price ||
                        0
                      );

                    const tax =
                      Number(
                        item?.tax ||
                        0
                      );

                    const discount =
                      Number(
                        item?.discount ||
                        0
                      );

                    const total =
                      Number(
                        item?.total ??
                        price *
                          quantity +
                          tax -
                          discount
                      );

                    return (

                      <div
                        key={
                          stringifyId(
                            item?._id
                          ) ||
                          index
                        }
                        className="rounded-2xl border border-neutral-200 overflow-hidden"
                      >

                        {/* PRODUCT TOP */}

                        <div className="p-4">

                          <div className="flex flex-col sm:flex-row gap-4">

                            {/* MAIN IMAGE */}

                            <div className="w-full sm:w-32 h-32 shrink-0 rounded-2xl bg-neutral-100 overflow-hidden flex items-center justify-center">

                              {image ? (

                                <img
                                  src={image}
                                  alt={getProductTitle(
                                    item
                                  )}
                                  className="w-full h-full object-cover"
                                />

                              ) : (

                                <Package
                                  size={36}
                                  className="text-neutral-400"
                                />

                              )}

                            </div>


                            {/* BASIC PRODUCT INFO */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-3">

                                <div>

                                  <h4 className="font-bold text-base">
                                    {getProductTitle(
                                      item
                                    )}
                                  </h4>

                                  {item?.variantSku && (

                                    <p className="text-xs text-neutral-500 mt-1">
                                      Variant SKU:{" "}
                                      {displayValue(
                                        item.variantSku
                                      )}
                                    </p>

                                  )}

                                </div>


                                <span className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-bold">
                                  ×{quantity}
                                </span>

                              </div>


                              <div className="grid grid-cols-2 gap-2 mt-4">

                                <SmallInfo
                                  label="Brand"
                                  value={
                                    getProductBrand(
                                      item
                                    ) || "—"
                                  }
                                />

                                <SmallInfo
                                  label="Category"
                                  value={
                                    getProductCategory(
                                      item
                                    ) || "—"
                                  }
                                />

                                <SmallInfo
                                  label="Price"
                                  value={money(
                                    price
                                  )}
                                />

                                <SmallInfo
                                  label="Item Total"
                                  value={money(
                                    total
                                  )}
                                />

                              </div>

                            </div>

                          </div>

                        </div>


                        {/* ALL PRODUCT IMAGES */}

                        {images.length > 0 && (

                          <div className="border-t border-neutral-100 p-4">

                            <div className="flex items-center gap-2 mb-3">

                              <Layers size={15} />

                              <p className="text-xs font-bold uppercase tracking-wider">
                                Product Images
                              </p>

                            </div>


                            <div className="flex gap-3 overflow-x-auto pb-1">

                              {images.map(
                                (
                                  img,
                                  imageIndex
                                ) => (

                                  <a
                                    key={`${img}-${imageIndex}`}
                                    href={img}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-24 h-24 shrink-0 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50"
                                  >

                                    <img
                                      src={img}
                                      alt={`${getProductTitle(
                                        item
                                      )} ${imageIndex + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition"
                                    />

                                  </a>

                                )
                              )}

                            </div>

                          </div>

                        )}


                        {/* COMPLETE PRODUCT DATA */}

                        <div className="border-t border-neutral-100 p-4 bg-neutral-50">

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                            <InfoBox
                              label="Product ID"
                              value={getProductId(
                                item
                              )}
                              copyable
                              onCopy={onCopy}
                            />

                            <InfoBox
                              label="Seller ID"
                              value={getSellerId(
                                item
                              )}
                              copyable
                              onCopy={onCopy}
                            />

                            <InfoBox
                              label="SKU"
                              value={
                                item?.variantSku
                              }
                            />

                            <InfoBox
                              label="Slug"
                              value={getProductSlug(
                                item
                              )}
                            />

                            <InfoBox
                              label="Quantity"
                              value={
                                item?.quantity
                              }
                            />

                            <InfoBox
                              label="Unit Price"
                              value={money(
                                price
                              )}
                            />

                            <InfoBox
                              label="Tax"
                              value={money(
                                tax
                              )}
                            />

                            <InfoBox
                              label="Discount"
                              value={money(
                                discount
                              )}
                            />

                            <InfoBox
                              label="Final Total"
                              value={money(
                                total
                              )}
                            />

                          </div>


                          {/* POPULATED PRODUCT DATA */}

                          {product && (

                            <div className="mt-4">

                              <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                                Populated Product Details
                              </p>

                              <div className="grid grid-cols-2 gap-3">

                                <InfoBox
                                  label="Product Title"
                                  value={
                                    product.title
                                  }
                                />

                                <InfoBox
                                  label="Product Slug"
                                  value={
                                    product.slug
                                  }
                                />

                                <InfoBox
                                  label="Product Brand"
                                  value={
                                    product.brand
                                  }
                                />

                                <InfoBox
                                  label="Product Category"
                                  value={
                                    product.category
                                  }
                                />

                              </div>

                            </div>

                          )}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </Section>


            {/* =================================================
                PRICING
            ================================================= */}

            <Section
              title="Payment & Pricing"
              icon={
                <CreditCard size={17} />
              }
            >

              <div className="rounded-2xl border border-neutral-200 overflow-hidden">

                <div className="p-4 bg-neutral-50 space-y-3">

                  <PriceRow
                    label="Subtotal"
                    value={money(
                      pricing?.subtotal
                    )}
                  />

                  <PriceRow
                    label="Product Discount"
                    value={`-${money(
                      pricing?.discount
                    )}`}
                  />

                  <PriceRow
                    label="Coupon Discount"
                    value={`-${money(
                      pricing?.couponDiscount
                    )}`}
                  />

                  <PriceRow
                    label="Tax"
                    value={money(
                      pricing?.tax
                    )}
                  />

                  <PriceRow
                    label="Shipping Charge"
                    value={money(
                      pricing?.shippingCharge
                    )}
                  />

                  <div className="border-t border-neutral-200 pt-3">

                    <PriceRow
                      label="Grand Total"
                      value={money(
                        pricing?.total
                      )}
                      strong
                    />

                  </div>

                </div>


                <div className="p-4">

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                    <InfoBox
                      label="Payment Method"
                      value={
                        payment?.method
                      }
                    />

                    <InfoBox
                      label="Payment Status"
                      value={
                        payment?.status
                      }
                    />

                    <InfoBox
                      label="Coupon Code"
                      value={
                        pricing?.couponCode ||
                        "None"
                      }
                    />

                    <InfoBox
                      label="Coupon Type"
                      value={
                        pricing?.couponType ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Transaction ID"
                      value={
                        payment?.transactionId ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Failure Reason"
                      value={
                        payment?.paymentFailureReason ||
                        "—"
                      }
                    />

                  </div>

                </div>

              </div>

            </Section>


            {/* =================================================
                PAYMENT GATEWAY
            ================================================= */}

            <Section
              title="Payment Gateway"
              icon={
                <Wallet size={17} />
              }
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <InfoBox
                  label="Gateway Order ID"
                  value={
                    gateway?.orderId
                  }
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="Payment ID"
                  value={
                    gateway?.paymentId
                  }
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="Signature"
                  value={
                    gateway?.signature
                  }
                />

                <InfoBox
                  label="Transaction ID"
                  value={
                    payment?.transactionId
                  }
                />

              </div>

            </Section>


            {/* =================================================
                MARKETPLACE
            ================================================= */}

            <Section
              title="Marketplace Financials"
              icon={
                <CircleDollarSign size={17} />
              }
            >

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <InfoBox
                  label="Commission"
                  value={money(
                    marketplace?.commissionAmount
                  )}
                />

                <InfoBox
                  label="Seller Amount"
                  value={money(
                    marketplace?.sellerAmount
                  )}
                />

                <InfoBox
                  label="Platform Profit"
                  value={money(
                    marketplace?.platformProfit
                  )}
                />

              </div>

            </Section>


            {/* =================================================
                SHIPPING
            ================================================= */}

            <Section
              title="Shipping"
              icon={
                <Truck size={17} />
              }
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <InfoBox
                  label="Courier"
                  value={
                    shipping?.courierName ||
                    "Not assigned"
                  }
                />

                <InfoBox
                  label="Courier ID"
                  value={stringifyId(
                    shipping?.courier
                  )}
                />

                <InfoBox
                  label="Tracking Number"
                  value={
                    shipping?.trackingNumber ||
                    "Not available"
                  }
                  copyable
                  onCopy={onCopy}
                />

                <InfoBox
                  label="Tracking URL"
                  value={
                    shipping?.trackingUrl ||
                    "Not available"
                  }
                />

                <InfoBox
                  label="Estimated Delivery"
                  value={formatDate(
                    shipping?.estimatedDelivery
                  )}
                />

                <InfoBox
                  label="Delivered At"
                  value={formatDateTime(
                    order?.deliveredAt
                  )}
                />

              </div>


              {shipping?.trackingUrl && (

                <a
                  href={
                    shipping.trackingUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold"
                >

                  <Navigation
                    size={14}
                  />

                  Track Shipment

                  <ExternalLink
                    size={14}
                  />

                </a>

              )}


              <div className="flex flex-wrap gap-2 mt-4">

                {order?.status ===
                  "Ready for Pickup" && (

                  <button
                    disabled={
                      actionLoading
                    }
                    onClick={
                      onAssignCourier
                    }
                    className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40"
                  >
                    Assign Courier
                  </button>

                )}


                {shipping?.trackingNumber && (

                  <button
                    disabled={
                      actionLoading
                    }
                    onClick={
                      onTracking
                    }
                    className="px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold disabled:opacity-40"
                  >
                    Update Tracking
                  </button>

                )}

              </div>

            </Section>


            {/* =================================================
                DELIVERY ADDRESS
            ================================================= */}

            <Section
              title="Complete Delivery Address"
              icon={
                <MapPin size={17} />
              }
            >

              <div className="rounded-2xl border border-neutral-200 overflow-hidden">

                {/* CONTACT */}

                <div className="p-4 bg-neutral-50">

                  <div className="flex items-center gap-2 mb-3">

                    <UserRound
                      size={15}
                    />

                    <p className="text-xs font-bold uppercase tracking-wider">
                      Delivery Contact
                    </p>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <InfoBox
                      label="Full Name"
                      value={
                        deliveryAddress
                          ?.customer
                          ?.fullName
                      }
                    />

                    <InfoBox
                      label="Phone"
                      value={
                        deliveryAddress
                          ?.customer
                          ?.phone
                      }
                    />

                    <InfoBox
                      label="Alternate Phone"
                      value={
                        deliveryAddress
                          ?.customer
                          ?.alternatePhone ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Email"
                      value={
                        deliveryAddress
                          ?.customer
                          ?.email
                      }
                    />

                  </div>

                </div>


                {/* ADDRESS */}

                <div className="p-4">

                  <div className="flex items-center gap-2 mb-3">

                    <Home
                      size={15}
                    />

                    <p className="text-xs font-bold uppercase tracking-wider">
                      Address
                    </p>

                  </div>


                  <div className="rounded-xl border border-neutral-200 p-4">

                    <p className="font-semibold leading-6">
                      {address?.addressLine1 ||
                        "Address not available"}
                    </p>

                    {address?.addressLine2 && (

                      <p className="text-neutral-600 leading-6">
                        {address.addressLine2}
                      </p>

                    )}


                    <p className="text-neutral-600 leading-6 mt-1">

                      {[
                        address?.area,
                        address?.landmark,
                        address?.city,
                        address?.district,
                        address?.state,
                        address?.postalCode,
                        address?.country,
                      ]
                        .map(
                          displayValue
                        )
                        .filter(Boolean)
                        .join(", ")}

                    </p>

                  </div>


                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">

                    <InfoBox
                      label="Area"
                      value={
                        address?.area
                      }
                    />

                    <InfoBox
                      label="Landmark"
                      value={
                        address?.landmark
                      }
                    />

                    <InfoBox
                      label="City"
                      value={
                        address?.city
                      }
                    />

                    <InfoBox
                      label="District"
                      value={
                        address?.district
                      }
                    />

                    <InfoBox
                      label="State"
                      value={
                        address?.state
                      }
                    />

                    <InfoBox
                      label="Postal Code"
                      value={
                        address?.postalCode
                      }
                    />

                    <InfoBox
                      label="Country"
                      value={
                        address?.country
                      }
                    />

                  </div>

                </div>


                {/* LOCATION */}

                <div className="border-t border-neutral-100 p-4">

                  <div className="flex items-center gap-2 mb-3">

                    <MapPinned
                      size={15}
                    />

                    <p className="text-xs font-bold uppercase tracking-wider">
                      Location
                    </p>

                  </div>


                  <div className="grid grid-cols-2 gap-3">

                    <InfoBox
                      label="Latitude"
                      value={
                        location?.latitude
                      }
                    />

                    <InfoBox
                      label="Longitude"
                      value={
                        location?.longitude
                      }
                    />

                    <InfoBox
                      label="Formatted Address"
                      value={
                        location?.formattedAddress ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Google Place ID"
                      value={
                        location?.googlePlaceId ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Plus Code"
                      value={
                        location?.plusCode ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Map URL"
                      value={
                        location?.mapUrl ||
                        "—"
                      }
                    />

                  </div>


                  {location?.mapUrl && (

                    <a
                      href={
                        location.mapUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl border border-black text-xs font-bold"
                    >

                      <MapPinned
                        size={14}
                      />

                      Open Map

                      <ExternalLink
                        size={14}
                      />

                    </a>

                  )}

                </div>


                {/* PREFERENCE */}

                <div className="border-t border-neutral-100 p-4">

                  <div className="flex items-center gap-2 mb-3">

                    <Clock
                      size={15}
                    />

                    <p className="text-xs font-bold uppercase tracking-wider">
                      Delivery Preference
                    </p>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <InfoBox
                      label="Address Type"
                      value={
                        preference?.addressType
                      }
                    />

                    <InfoBox
                      label="Preferred Delivery Time"
                      value={
                        preference?.preferredDeliveryTime ||
                        "Any time"
                      }
                    />

                    <InfoBox
                      label="Delivery Instructions"
                      value={
                        preference?.deliveryInstructions ||
                        "None"
                      }
                    />

                    <InfoBox
                      label="Default Address"
                      value={
                        preference?.isDefault
                          ? "Yes"
                          : "No"
                      }
                    />

                  </div>

                </div>

              </div>

            </Section>


            {/* =================================================
                CANCELLATION
            ================================================= */}

            <Section
              title="Cancellation"
              icon={
                <Ban size={17} />
              }
            >

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <InfoBox
                  label="Allowed"
                  value={
                    cancellation?.allowed
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoBox
                  label="Cancelled"
                  value={
                    cancellation?.cancelled
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoBox
                  label="Cancel Before"
                  value={formatDateTime(
                    cancellation?.cancelBefore
                  )}
                />

                <InfoBox
                  label="Cancelled At"
                  value={formatDateTime(
                    cancellation?.cancelledAt
                  )}
                />

                <InfoBox
                  label="Cancelled By"
                  value={
                    cancellation?.cancelledBy ||
                    "—"
                  }
                />

                <InfoBox
                  label="Reason"
                  value={
                    cancellation?.reason ||
                    "—"
                  }
                />

              </div>

            </Section>


            {/* =================================================
                STOCK
            ================================================= */}

            <Section
              title="Stock"
              icon={
                <Database size={17} />
              }
            >

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                <InfoBox
                  label="Deducted"
                  value={
                    stock?.deducted
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoBox
                  label="Restored"
                  value={
                    stock?.restored
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoBox
                  label="Deducted At"
                  value={formatDateTime(
                    stock?.deductedAt
                  )}
                />

                <InfoBox
                  label="Restored At"
                  value={formatDateTime(
                    stock?.restoredAt
                  )}
                />

              </div>

            </Section>


            {/* =================================================
                ORDER TIMELINE
            ================================================= */}

            {Array.isArray(
              order?.statusHistory
            ) &&
              order.statusHistory.length >
                0 && (

                <Section
                  title="Order Timeline"
                  icon={
                    <Clock size={17} />
                  }
                >

                  <div className="space-y-4">

                    {[
                      ...order.statusHistory,
                    ]
                      .reverse()
                      .map(
                        (
                          history,
                          index
                        ) => (

                          <div
                            key={
                              stringifyId(
                                history?._id
                              ) ||
                              index
                            }
                            className="flex gap-3"
                          >

                            <div className="flex flex-col items-center">

                              <div className="w-3 h-3 rounded-full bg-black mt-1.5" />

                              {index <
                                order
                                  .statusHistory
                                  .length -
                                  1 && (

                                <div className="w-px flex-1 bg-neutral-200 mt-1" />

                              )}

                            </div>


                            <div className="pb-2 min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold text-sm">
                                  {displayValue(
                                    history?.status
                                  )}
                                </p>

                                {history?.status ===
                                  order?.status && (

                                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] font-bold">
                                    CURRENT
                                  </span>

                                )}

                              </div>


                              <p className="text-xs text-neutral-500 mt-1">
                                {formatDateTime(
                                  history?.date
                                )}
                              </p>


                              {history?.updatedBy && (

                                <p className="text-[11px] text-neutral-400 mt-1 break-all">
                                  Updated by:{" "}
                                  {stringifyId(
                                    history.updatedBy
                                  )}
                                </p>

                              )}


                              {history?.remark && (

                                <p className="text-xs text-neutral-600 mt-2 rounded-lg bg-neutral-50 p-2">
                                  {displayValue(
                                    history.remark
                                  )}
                                </p>

                              )}

                            </div>

                          </div>

                        )
                      )}

                  </div>

                </Section>

              )}


            {/* =================================================
                REFUND
            ================================================= */}

            <Section
              title="Refund"
              icon={
                <CircleDollarSign
                  size={17}
                />
              }
            >

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <InfoBox
                  label="Status"
                  value={
                    refund?.status
                  }
                />

                <InfoBox
                  label="Amount"
                  value={money(
                    refund?.amount
                  )}
                />

                <InfoBox
                  label="Refund ID"
                  value={
                    refund?.refundId
                  }
                />

                <InfoBox
                  label="Refund Method"
                  value={
                    refund?.refundMethod
                  }
                />

                <InfoBox
                  label="Refund Transaction"
                  value={
                    refund?.refundTransactionId
                  }
                />

                <InfoBox
                  label="Refunded At"
                  value={formatDateTime(
                    refund?.refundedAt
                  )}
                />

                <InfoBox
                  label="Remark"
                  value={
                    refund?.remark
                  }
                />

              </div>

            </Section>


            {/* =================================================
                RETURN MANAGEMENT
            ================================================= */}

            {(
              String(
                order?.status || ""
              )
                .toLowerCase()
                .includes("return") ||
              [
                "Inspection",
                "Refund Processing",
              ].includes(
                order?.status
              )
            ) && (

              <ReturnManagement
                order={order}
                actionLoading={
                  actionLoading
                }
                onReturnAction={
                  onReturnAction
                }
                onReturnCourier={
                  onReturnCourier
                }
                onReturnPicked={
                  onReturnPicked
                }
                onReceiveReturn={
                  onReceiveReturn
                }
                onInspection={
                  onInspection
                }
                onRefund={
                  onRefund
                }
              />

            )}

          </div>

        </div>

      </aside>

    </div>
  );
}


/* =========================================================
   COURIER ASSIGNMENT MODAL
========================================================= */
function CourierAssignmentModal({
  couriers,
  loading,
  submitting,
  mode,
  currentCourier,
  currentCourierName,
  onClose,
  onSubmit,
}) {
  const [courierId, setCourierId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const selectedCourier = useMemo(
    () =>
      couriers.find(
        (courier) =>
          stringifyId(courier?._id) === courierId
      ),
    [couriers, courierId]
  );

  useEffect(() => {
    const existingId = stringifyId(currentCourier);
    if (existingId) setCourierId(existingId);
  }, [currentCourier]);

  const submit = (event) => {
    event.preventDefault();

    if (!courierId) {
      toast.error("Please select a courier");
      return;
    }

    if (mode === "return" && !trackingNumber.trim()) {
      toast.error("Return tracking number is required");
      return;
    }

    onSubmit({
      courierId,
      trackingNumber:
        mode === "return" ? trackingNumber.trim() : "",
      estimatedDelivery,
      mode,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        aria-label="Close courier modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-neutral-200 shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck size={20} />
                <h3 className="text-lg sm:text-xl font-bold">
                  {mode === "return"
                    ? "Assign Return Courier"
                    : "Assign Courier"}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Select a verified, available courier for this shipment.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-10 h-10 shrink-0 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm font-medium mt-3">
                Loading couriers...
              </p>
            </div>
          ) : couriers.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 p-6 text-center">
              <Truck size={30} className="mx-auto text-neutral-400" />
              <p className="font-bold mt-3">No active couriers found</p>
              <p className="text-sm text-neutral-500 mt-1">
                Add or activate a courier before assigning this shipment.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                    Courier
                  </label>
                  {currentCourierName && (
                    <span className="text-[11px] text-neutral-400">
                      Current: {displayValue(currentCourierName)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {couriers.map((courier) => {
                    const id = stringifyId(courier?._id);
                    const active = id === courierId;

                    return (
                      <button
                        type="button"
                        key={id || courier?.code || courier?.name}
                        onClick={() => setCourierId(id)}
                        className={`text-left rounded-2xl border p-4 transition ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-black bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {courier?.photo ? (
                            <img
                              src={courier.photo}
                              alt={courier.name || "Courier"}
                              className="w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                                active
                                  ? "bg-white text-black border-white"
                                  : "bg-neutral-50 border-neutral-200"
                              }`}
                            >
                              <User size={19} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">
                              {displayValue(courier?.name) || "Courier"}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                active
                                  ? "text-neutral-300"
                                  : "text-neutral-500"
                              }`}
                            >
                              {displayValue(courier?.vehicleType) || "Vehicle"}
                              {courier?.vehicleNumber
                                ? ` • ${displayValue(courier.vehicleNumber)}`
                                : ""}
                            </p>
                          </div>

                          {active && <CheckCircle2 size={18} />}
                        </div>

                        <div
                          className={`grid grid-cols-3 gap-2 mt-4 text-[10px] ${
                            active
                              ? "text-neutral-200"
                              : "text-neutral-500"
                          }`}
                        >
                          <span>
                            {displayValue(
                              courier?.estimatedDeliveryMinutes
                            ) || "—"}{" "}
                            min
                          </span>
                          <span>
                            {displayValue(courier?.status) || "available"}
                          </span>
                          <span>
                            ⭐{" "}
                            {Number.isFinite(Number(courier?.rating))
                              ? Number(courier.rating).toFixed(1)
                              : "5.0"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCourier && (
                <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} />
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Selected Courier
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SmallInfo label="Name" value={selectedCourier.name} />
                    <SmallInfo
                      label="Vehicle"
                      value={
                        selectedCourier.vehicleNumber
                          ? `${selectedCourier.vehicleType || "Vehicle"} • ${selectedCourier.vehicleNumber}`
                          : selectedCourier.vehicleType || "Vehicle"
                      }
                    />
                    <SmallInfo
                      label="Status"
                      value={selectedCourier.status || "available"}
                    />
                    <SmallInfo
                      label="Rating"
                      value={
                        Number.isFinite(Number(selectedCourier.rating))
                          ? Number(selectedCourier.rating).toFixed(1)
                          : "5.0"
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <label className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                    Tracking Number
                  </label>

                  {mode === "return" ? (
                    <>
                      <input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter return tracking / AWB"
                        className="mt-2 w-full h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-black"
                      />
                      <p className="text-[11px] text-neutral-500 mt-2">
                        Return shipments require their carrier/AWB tracking number.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mt-2 h-12 rounded-xl border border-neutral-200 bg-white px-4 flex items-center">
                        <span className="font-mono font-bold text-sm">
                          {currentCourierName ? "Generated after assignment" : "Generated automatically"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-2">
                        Odikart generates the outbound tracking number from the order.
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                    Estimated Delivery
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-2 w-full h-12 rounded-xl border border-neutral-300 px-4 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-5 sm:p-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-3 rounded-xl border border-neutral-300 text-sm font-bold disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading || !couriers.length}
            className="px-5 py-3 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {mode === "return" ? "Assign Return Courier" : "Assign Courier & Generate Tracking"}
          </button>
        </div>
      </form>
    </div>
  );
}


/* =========================================================
   RETURN MANAGEMENT
========================================================= */

function ReturnManagement({
  order,
  actionLoading,
  onReturnAction,
  onReturnCourier,
  onReturnPicked,
  onReceiveReturn,
  onInspection,
  onRefund,
}) {
  const status =
    order?.status;

  const returnDetails =
    order?.returnDetails ||
    {};

  const images =
    Array.isArray(
      returnDetails?.images
    )
      ? returnDetails.images
      : [];

  const videos =
    Array.isArray(
      returnDetails?.videos
    )
      ? returnDetails.videos
      : [];


  return (
    <Section
      title="Return Management"
      icon={
        <RotateCcw size={17} />
      }
    >

      <div className="rounded-2xl border border-neutral-200 overflow-hidden">

        {/* RETURN INFORMATION */}

        <div className="p-4 bg-neutral-50">

          <div className="grid grid-cols-2 gap-3">

            <InfoBox
              label="Requested"
              value={
                returnDetails?.requested
                  ? "Yes"
                  : "No"
              }
            />

            <InfoBox
              label="Reason"
              value={
                returnDetails?.reason ||
                "Not specified"
              }
            />

            <InfoBox
              label="Reason Type"
              value={
                returnDetails?.reasonType
              }
            />

            <InfoBox
              label="Resolution"
              value={
                returnDetails?.resolution ||
                "Refund"
              }
            />

            <InfoBox
              label="Inspection"
              value={
                returnDetails?.inspectionStatus ||
                "Pending"
              }
            />

            <InfoBox
              label="Refund Amount"
              value={money(
                returnDetails?.refundAmount ||
                order?.refund?.amount ||
                order?.pricing?.total ||
                0
              )}
            />

          </div>

        </div>


        {/* COMMENTS */}

        <div className="p-4 border-t border-neutral-100 space-y-3">

          <InfoBox
            label="Customer Comment"
            value={
              returnDetails?.customerComment ||
              "—"
            }
          />

          <InfoBox
            label="Seller Remark"
            value={
              returnDetails?.sellerRemark ||
              "—"
            }
          />

          <InfoBox
            label="Admin Remark"
            value={
              returnDetails?.adminRemark ||
              "—"
            }
          />

        </div>


        {/* RETURN MEDIA */}

        {(images.length > 0 ||
          videos.length > 0) && (

          <div className="p-4 border-t border-neutral-100">

            <p className="text-xs font-bold uppercase tracking-wider mb-3">
              Return Media
            </p>


            {images.length > 0 && (

              <div className="flex gap-3 overflow-x-auto">

                {images.map(
                  (
                    image,
                    index
                  ) => (

                    <a
                      key={
                        `${image}-${index}`
                      }
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-neutral-200"
                    >

                      <img
                        src={image}
                        alt="Return"
                        className="w-full h-full object-cover"
                      />

                    </a>

                  )
                )}

              </div>

            )}


            {videos.length > 0 && (

              <div className="mt-4 space-y-2">

                {videos.map(
                  (
                    video,
                    index
                  ) => (

                    <a
                      key={
                        `${video}-${index}`
                      }
                      href={video}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold underline"
                    >
                      Video {index + 1}
                      <ExternalLink
                        size={14}
                      />
                    </a>

                  )
                )}

              </div>

            )}

          </div>

        )}


        {/* ACTIONS */}

        <div className="p-4 border-t border-neutral-100 space-y-2">

          {status ===
            "Return Requested" && (

            <div className="grid grid-cols-2 gap-2">

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  onReturnAction(
                    "approve"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
              >

                <CheckCircle2
                  size={16}
                />

                Approve

              </button>


              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  onReturnAction(
                    "reject"
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-black py-3 text-sm font-bold disabled:opacity-40"
              >

                <XCircle
                  size={16}
                />

                Reject

              </button>

            </div>

          )}


          {status ===
            "Return Approved" && (

            <button
              disabled={
                actionLoading
              }
              onClick={
                onReturnCourier
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
            >

              <Truck size={16} />

              Assign Return Courier

            </button>

          )}


          {status ===
            "Return Pickup Scheduled" && (

            <button
              disabled={
                actionLoading
              }
              onClick={
                onReturnPicked
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
            >

              <Truck size={16} />

              Mark Return Picked Up

            </button>

          )}


          {status ===
            "Return Picked Up" && (

            <button
              disabled={
                actionLoading
              }
              onClick={
                onReceiveReturn
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
            >

              <Package size={16} />

              Receive Returned Product

            </button>

          )}


          {status ===
            "Received by Admin" && (

            <div className="grid grid-cols-2 gap-2">

              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  onInspection(
                    "Passed"
                  )
                }
                className="rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
              >
                Inspection Passed
              </button>


              <button
                disabled={
                  actionLoading
                }
                onClick={() =>
                  onInspection(
                    "Failed"
                  )
                }
                className="rounded-xl border border-black py-3 text-sm font-bold disabled:opacity-40"
              >
                Inspection Failed
              </button>

            </div>

          )}


          {status ===
            "Refund Processing" && (

            <button
              disabled={
                actionLoading
              }
              onClick={
                onRefund
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-bold disabled:opacity-40"
            >

              <IndianRupee
                size={16}
              />

              Complete Refund

            </button>

          )}


          {[
            "Refund Completed",
            "Return Rejected",
          ].includes(status) && (

            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 p-3 text-sm font-semibold">

              {status ===
              "Refund Completed" ? (
                <CheckCircle2
                  size={17}
                />
              ) : (
                <Ban
                  size={17}
                />
              )}

              {status}

            </div>

          )}

        </div>

      </div>

    </Section>
  );
}


/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  icon,
  children,
}) {
  return (
    <section>

      <div className="flex items-center gap-2 mb-3">

        <span className="text-black">
          {icon}
        </span>

        <h3 className="font-bold">
          {title}
        </h3>

      </div>

      {children}

    </section>
  );
}


/* =========================================================
   PRICE ROW
========================================================= */

function PriceRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "text-base"
          : "text-sm"
      }`}
    >

      <span
        className={
          strong
            ? "font-bold"
            : "text-neutral-600"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-bold"
            : "font-medium"
        }
      >
        {displayValue(value)}
      </span>

    </div>
  );
}


/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
  copyable = false,
  onCopy,
}) {
  const text =
    displayValue(value);

  return (
    <div className="rounded-xl border border-neutral-200 p-3 min-w-0">

      <div className="flex items-center justify-between gap-2">

        <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
          {label}
        </p>


        {copyable &&
          text &&
          onCopy && (

            <button
              onClick={() =>
                onCopy(
                  text,
                  label
                )
              }
              className="p-1 rounded hover:bg-neutral-100"
              title={`Copy ${label}`}
            >
              <Copy size={12} />
            </button>

          )}

      </div>


      <p className="text-sm font-semibold mt-1 break-words whitespace-pre-wrap">
        {text || "—"}
      </p>

    </div>
  );
}


/* =========================================================
   SMALL INFO
========================================================= */

function SmallInfo({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-neutral-50 p-2">

      <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">
        {label}
      </p>

      <p className="text-xs font-semibold mt-0.5 break-words">
        {displayValue(value)}
      </p>

    </div>
  );
}