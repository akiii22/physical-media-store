import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import {
  updateOrderStatus,
  updateShipment,
  type ShipmentStatus,
} from "../services/orderServices";

const API_URL = import.meta.env.VITE_API_URL;

type Order = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  delivery_method: string;
  recipient_name: string;
  phone: string;
  province: string | null;
  city: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;

  users: {
    id: string;
    email: string;
    role: string;
  };

  order_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];

  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
    proof_url: string | null;
    provider_reference: string | null;
    paid_at: string | null;
  }[];

  shipments: {
    id: string;
    courier: string | null;
    tracking_number: string | null;
    status: string;
    tracking_url: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
  }[];
};

type OrderFilter =
  | "ALL"
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "CANCELLED";

type DeliveryFilter = "ALL" | "DELIVERY" | "STORE_PICKUP";

const orderStatuses: { value: OrderFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAYMENT_FAILED", label: "Payment Failed" },
  { value: "PAID", label: "Paid" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_TO_SHIP", label: "Ready to Ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "CANCELLED", label: "Cancelled" },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

    case "PAYMENT_FAILED":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";

    case "PAID":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

    case "PROCESSING":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";

    case "READY_TO_SHIP":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";

    case "SHIPPED":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";

    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "READY_FOR_PICKUP":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";

    case "PICKED_UP":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "CANCELLED":
      return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

    default:
      return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  }
};

const getPaymentClass = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
};

const formatStatus = (status: string) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (amount: number) => {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<OrderFilter>("ALL");
  const [deliveryFilter, setDeliveryFilter] =
    useState<DeliveryFilter>("ALL");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<string, string>>({});

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [shipmentForms, setShipmentForms] = useState<
    Record<
      string,
      {
        courier: string;
        tracking_number: string;
        tracking_url: string;
        status: ShipmentStatus;
      }
    >
  >({});

  const [updatingShipmentId, setUpdatingShipmentId] =
    useState<string | null>(null);

  // ---------------------------------------------------------
  // LOAD ORDERS
  // ---------------------------------------------------------

  const loadOrders = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session not found.");
      }

      const response = await fetch(
        `${API_URL}/orders/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to retrieve orders."
        );
      }

      setOrders(data.data);
    } catch (err) {
      console.error("Failed to load orders:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve orders."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ---------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.id.toLowerCase().includes(normalizedSearch) ||
        order.recipient_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.users?.email
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        order.phone.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      const matchesDelivery =
        deliveryFilter === "ALL" ||
        order.delivery_method === deliveryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDelivery
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    deliveryFilter,
  ]);

  // ---------------------------------------------------------
  // STATS
  // ---------------------------------------------------------

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pendingPayment: orders.filter(
        (order) => order.status === "PENDING_PAYMENT"
      ).length,

      processing: orders.filter(
        (order) => order.status === "PROCESSING"
      ).length,

      readyToShip: orders.filter(
        (order) => order.status === "READY_TO_SHIP"
      ).length,

      completed: orders.filter(
        (order) =>
          order.status === "DELIVERED" ||
          order.status === "PICKED_UP"
      ).length,
    };
  }, [orders]);

  // ---------------------------------------------------------
  // ORDER STATUS
  // ---------------------------------------------------------

  const handleStatusChange = (
    orderId: string,
    status: string
  ) => {
    setSelectedStatuses((previous) => ({
      ...previous,
      [orderId]: status,
    }));
  };

  const handleUpdateStatus = async (
    orderId: string,
    currentStatus: string
  ) => {
    const newStatus =
      selectedStatuses[orderId] || currentStatus;

    if (newStatus === currentStatus) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      setError("");

      await updateOrderStatus(orderId, newStatus);

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      setSelectedStatuses((previous) => {
        const updated = { ...previous };

        delete updated[orderId];

        return updated;
      });

      setSelectedOrder((previous) =>
        previous?.id === orderId
          ? {
              ...previous,
              status: newStatus,
            }
          : previous
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ---------------------------------------------------------
  // SHIPMENT
  // ---------------------------------------------------------

  const getShipmentForm = (order: Order) => {
    const shipment = order.shipments?.[0];

    return (
      shipmentForms[order.id] ?? {
        courier: shipment?.courier ?? "",
        tracking_number:
          shipment?.tracking_number ?? "",
        tracking_url: shipment?.tracking_url ?? "",
        status:
          (shipment?.status as ShipmentStatus) ??
          "PENDING",
      }
    );
  };

  const handleShipmentChange = (
    orderId: string,
    field:
      | "courier"
      | "tracking_number"
      | "tracking_url"
      | "status",
    value: string
  ) => {
    setShipmentForms((previous) => {
      const existing =
        previous[orderId];

      return {
        ...previous,
        [orderId]: {
          courier: existing?.courier ?? "",
          tracking_number:
            existing?.tracking_number ?? "",
          tracking_url:
            existing?.tracking_url ?? "",
          status:
            existing?.status ?? "PENDING",
          [field]: value,
        },
      };
    });
  };

  const handleUpdateShipment = async (
    order: Order
  ) => {
    try {
      setUpdatingShipmentId(order.id);
      setError("");

      const form = getShipmentForm(order);

      await updateShipment(order.id, form);

      setOrders((previousOrders) =>
        previousOrders.map((currentOrder) => {
          if (currentOrder.id !== order.id) {
            return currentOrder;
          }

          const currentShipment =
            currentOrder.shipments?.[0];

          const updatedShipment = {
            id:
              currentShipment?.id ??
              `temp-${order.id}`,

            courier: form.courier,
            tracking_number:
              form.tracking_number,
            tracking_url:
              form.tracking_url,
            status: form.status,

            shipped_at:
              form.status === "SHIPPED"
                ? new Date().toISOString()
                : currentShipment?.shipped_at ??
                  null,

            delivered_at:
              form.status === "DELIVERED"
                ? new Date().toISOString()
                : currentShipment?.delivered_at ??
                  null,
          };

          let updatedOrderStatus =
            currentOrder.status;

          if (form.status === "READY_TO_SHIP") {
            updatedOrderStatus = "READY_TO_SHIP";
          }

          if (form.status === "SHIPPED") {
            updatedOrderStatus = "SHIPPED";
          }

          if (form.status === "DELIVERED") {
            updatedOrderStatus = "DELIVERED";
          }

          return {
            ...currentOrder,
            status: updatedOrderStatus,
            shipments: [updatedShipment],
          };
        })
      );

      setSelectedOrder((previous) => {
        if (!previous) {
          return previous;
        }

        const currentShipment =
          previous.shipments?.[0];

        const updatedShipment = {
          id:
            currentShipment?.id ??
            `temp-${order.id}`,

          courier: form.courier,
          tracking_number:
            form.tracking_number,
          tracking_url:
            form.tracking_url,
          status: form.status,

          shipped_at:
            form.status === "SHIPPED"
              ? new Date().toISOString()
              : currentShipment?.shipped_at ?? null,

          delivered_at:
            form.status === "DELIVERED"
              ? new Date().toISOString()
              : currentShipment?.delivered_at ?? null,
        };

        let updatedOrderStatus =
          previous.status;

        if (form.status === "READY_TO_SHIP") {
          updatedOrderStatus = "READY_TO_SHIP";
        }

        if (form.status === "SHIPPED") {
          updatedOrderStatus = "SHIPPED";
        }

        if (form.status === "DELIVERED") {
          updatedOrderStatus = "DELIVERED";
        }

        return {
          ...previous,
          status: updatedOrderStatus,
          shipments: [updatedShipment],
        };
      });

      setShipmentForms((previous) => {
        const updated = { ...previous };

        delete updated[order.id];

        return updated;
      });
    } catch (error) {
      console.error(
        "Failed to update shipment:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update shipment."
      );
    } finally {
      setUpdatingShipmentId(null);
    }
  };

  // ---------------------------------------------------------
  // OPEN ORDER
  // ---------------------------------------------------------

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrder = () => {
    if (
      updatingOrderId ||
      updatingShipmentId
    ) {
      return;
    }

    setSelectedOrder(null);
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 rounded-lg bg-gray-200" />

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-2xl bg-white"
                  />
                )
              )}
            </div>

            <div className="h-16 rounded-2xl bg-white" />

            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Store Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Orders
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Manage customer orders, payments, and fulfillment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {isRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex-1">
                {error}
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                statusFilter === "ALL"
                  ? "border-gray-900 ring-1 ring-gray-900"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total Orders
                </span>

                <ShoppingBag
                  size={18}
                  className="text-gray-400"
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter("PENDING_PAYMENT")
              }
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                statusFilter === "PENDING_PAYMENT"
                  ? "border-amber-400 ring-1 ring-amber-400"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Pending
                </span>

                <Clock3
                  size={18}
                  className="text-amber-500"
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stats.pendingPayment}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter("PROCESSING")
              }
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                statusFilter === "PROCESSING"
                  ? "border-violet-400 ring-1 ring-violet-400"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Processing
                </span>

                <Package
                  size={18}
                  className="text-violet-500"
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stats.processing}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter("READY_TO_SHIP")
              }
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                statusFilter === "READY_TO_SHIP"
                  ? "border-indigo-400 ring-1 ring-indigo-400"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Ready to Ship
                </span>

                <Truck
                  size={18}
                  className="text-indigo-500"
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stats.readyToShip}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");

                const completedOrders =
                  orders.filter(
                    (order) =>
                      order.status === "DELIVERED" ||
                      order.status === "PICKED_UP"
                  );

                if (completedOrders.length > 0) {
                  setStatusFilter("DELIVERED");
                }
              }}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Completed
                </span>

                <CheckCircle2
                  size={18}
                  className="text-emerald-500"
                />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search order ID, customer, email, or phone..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as OrderFilter
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 lg:w-52"
                >
                  {orderStatuses.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* Delivery */}
              <div className="relative">
                <select
                  value={deliveryFilter}
                  onChange={(event) =>
                    setDeliveryFilter(
                      event.target.value as DeliveryFilter
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 lg:w-48"
                >
                  <option value="ALL">
                    All fulfillment
                  </option>

                  <option value="DELIVERY">
                    Delivery
                  </option>

                  <option value="STORE_PICKUP">
                    Store Pickup
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filteredOrders.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {orders.length}
                </span>{" "}
                orders
              </p>

              {(search ||
                statusFilter !== "ALL" ||
                deliveryFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setDeliveryFilter("ALL");
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <ShoppingBag
                    size={24}
                    className="text-gray-400"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  No orders found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Order
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Total
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Fulfillment
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const payment =
                        order.payments?.[0];

                      const shipment =
                        order.shipments?.[0];

                      return (
                        <tr
                          key={order.id}
                          className="group transition hover:bg-gray-50"
                        >
                          {/* Order */}
                          <td className="px-5 py-5">
                            <div>
                              <p className="font-mono text-sm font-semibold text-gray-900">
                                #{order.id.slice(0, 8)}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {order.order_items.length}{" "}
                                {order.order_items.length ===
                                1
                                  ? "item"
                                  : "items"}
                              </p>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-5">
                            <p className="font-medium text-gray-900">
                              {order.recipient_name}
                            </p>

                            <p className="mt-1 max-w-[180px] truncate text-xs text-gray-500">
                              {order.users?.email ??
                                "No email"}
                            </p>
                          </td>

                          {/* Total */}
                          <td className="px-5 py-5">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(
                                order.total_amount
                              )}
                            </p>
                          </td>

                          {/* Payment */}
                          <td className="px-5 py-5">
                            {payment ? (
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {payment.method}
                                </p>

                                <span
                                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPaymentClass(
                                    payment.status
                                  )}`}
                                >
                                  {payment.status}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* Fulfillment */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2">
                              {order.delivery_method ===
                              "STORE_PICKUP" ? (
                                <MapPin
                                  size={15}
                                  className="text-cyan-600"
                                />
                              ) : (
                                <Truck
                                  size={15}
                                  className="text-gray-500"
                                />
                              )}

                              <span className="text-sm text-gray-700">
                                {order.delivery_method ===
                                "STORE_PICKUP"
                                  ? "Store Pickup"
                                  : "Delivery"}
                              </span>
                            </div>

                            {shipment?.tracking_number && (
                              <p className="mt-1 text-xs text-gray-400">
                                {shipment.tracking_number}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <CalendarDays
                                size={14}
                              />

                              {new Date(
                                order.created_at
                              ).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-5 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openOrder(order)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                            >
                              View
                              <ArrowRight
                                size={14}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          ORDER DRAWER
      ===================================================== */}

      {selectedOrder && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={closeOrder}
          />

          {/* Drawer */}
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Order
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-lg font-bold text-gray-900">
                    #{selectedOrder.id.slice(0, 8)}
                  </h2>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                      selectedOrder.status
                    )}`}
                  >
                    {formatStatus(
                      selectedOrder.status
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(
                    selectedOrder.created_at
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrder}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={21} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 p-5 sm:p-6">
                {/* Customer */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <User
                      size={17}
                      className="text-gray-500"
                    />

                    <h3 className="font-semibold text-gray-900">
                      Customer
                    </h3>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-medium text-gray-900">
                      {selectedOrder.recipient_name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedOrder.users?.email ??
                        "No email"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedOrder.phone}
                    </p>
                  </div>
                </section>

                {/* Items */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <ShoppingBag
                      size={17}
                      className="text-gray-500"
                    />

                    <h3 className="font-semibold text-gray-900">
                      Order Items
                    </h3>
                  </div>

                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {selectedOrder.order_items.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-4"
                        >
                          <div>
                            <p className="font-mono text-xs text-gray-400">
                              Product{" "}
                              {item.product_id.slice(
                                0,
                                8
                              )}
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                              Quantity:{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              item.unit_price *
                                item.quantity
                            )}
                          </p>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between bg-gray-50 p-4">
                      <span className="text-sm font-medium text-gray-600">
                        Total
                      </span>

                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          selectedOrder.total_amount
                        )}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CreditCard
                      size={17}
                      className="text-gray-500"
                    />

                    <h3 className="font-semibold text-gray-900">
                      Payment
                    </h3>
                  </div>

                  {selectedOrder.payments?.[0] ? (
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {
                              selectedOrder
                                .payments[0].method
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {formatCurrency(
                              selectedOrder
                                .payments[0].amount
                            )}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPaymentClass(
                            selectedOrder
                              .payments[0].status
                          )}`}
                        >
                          {
                            selectedOrder
                              .payments[0].status
                          }
                        </span>
                      </div>

                      {selectedOrder.payments[0]
                        .provider_reference && (
                        <div className="mt-4 border-t border-gray-100 pt-3">
                          <p className="text-xs text-gray-400">
                            Reference
                          </p>

                          <p className="mt-1 font-mono text-xs text-gray-700">
                            {
                              selectedOrder
                                .payments[0]
                                .provider_reference
                            }
                          </p>
                        </div>
                      )}

                      {selectedOrder.payments[0]
                        .proof_url && (
                        <a
                          href={
                            selectedOrder
                              .payments[0]
                              .proof_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:underline"
                        >
                          View Payment Proof →
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      No payment information.
                    </div>
                  )}
                </section>

                {/* Fulfillment */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    {selectedOrder.delivery_method ===
                    "STORE_PICKUP" ? (
                      <MapPin
                        size={17}
                        className="text-gray-500"
                      />
                    ) : (
                      <Truck
                        size={17}
                        className="text-gray-500"
                      />
                    )}

                    <h3 className="font-semibold text-gray-900">
                      Fulfillment
                    </h3>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="font-medium text-gray-900">
                      {selectedOrder.delivery_method ===
                      "STORE_PICKUP"
                        ? "Store Pickup"
                        : "Delivery"}
                    </p>

                    {selectedOrder.delivery_method !==
                      "STORE_PICKUP" && (
                      <div className="mt-3 text-sm text-gray-500">
                        <p>
                          {
                            selectedOrder
                              .street_address
                          }
                        </p>

                        <p>
                          {
                            selectedOrder
                              .barangay
                          }
                          ,{" "}
                          {selectedOrder.city}
                        </p>

                        <p>
                          {
                            selectedOrder
                              .province
                          }{" "}
                          {
                            selectedOrder
                              .postal_code
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Shipment */}
                {selectedOrder.delivery_method !==
                  "STORE_PICKUP" && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Package
                        size={17}
                        className="text-gray-500"
                      />

                      <h3 className="font-semibold text-gray-900">
                        Shipment
                      </h3>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      {selectedOrder.shipments?.[0] && (
                        <div className="mb-5 rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              Current Shipment
                            </span>

                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClass(
                                selectedOrder
                                  .shipments[0]
                                  .status
                              )}`}
                            >
                              {formatStatus(
                                selectedOrder
                                  .shipments[0]
                                  .status
                              )}
                            </span>
                          </div>

                          {selectedOrder
                            .shipments[0]
                            .courier && (
                            <p className="mt-3 text-sm text-gray-700">
                              <span className="font-medium">
                                Courier:
                              </span>{" "}
                              {
                                selectedOrder
                                  .shipments[0]
                                  .courier
                              }
                            </p>
                          )}

                          {selectedOrder
                            .shipments[0]
                            .tracking_number && (
                            <p className="mt-1 text-sm text-gray-700">
                              <span className="font-medium">
                                Tracking:
                              </span>{" "}
                              {
                                selectedOrder
                                  .shipments[0]
                                  .tracking_number
                              }
                            </p>
                          )}

                          {selectedOrder
                            .shipments[0]
                            .tracking_url && (
                            <a
                              href={
                                selectedOrder
                                  .shipments[0]
                                  .tracking_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-xs font-medium text-blue-600 hover:underline"
                            >
                              Track Package →
                            </a>
                          )}
                        </div>
                      )}

                      {(() => {
                        const form =
                          getShipmentForm(
                            selectedOrder
                          );

                        const isUpdating =
                          updatingShipmentId ===
                          selectedOrder.id;

                        return (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Courier
                              </label>

                              <input
                                type="text"
                                value={form.courier}
                                onChange={(event) =>
                                  handleShipmentChange(
                                    selectedOrder.id,
                                    "courier",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="e.g. J&T Express"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Tracking Number
                              </label>

                              <input
                                type="text"
                                value={
                                  form.tracking_number
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    selectedOrder.id,
                                    "tracking_number",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Enter tracking number"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Tracking URL
                              </label>

                              <input
                                type="url"
                                value={
                                  form.tracking_url
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    selectedOrder.id,
                                    "tracking_url",
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="https://..."
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Shipment Status
                              </label>

                              <select
                                value={form.status}
                                onChange={(event) =>
                                  handleShipmentChange(
                                    selectedOrder.id,
                                    "status",
                                    event.target.value
                                  )
                                }
                                disabled={
                                  isUpdating
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              >
                                <option value="PENDING">
                                  Pending
                                </option>

                                <option value="READY_TO_SHIP">
                                  Ready to Ship
                                </option>

                                <option value="SHIPPED">
                                  Shipped
                                </option>

                                <option value="DELIVERED">
                                  Delivered
                                </option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateShipment(
                                  selectedOrder
                                )
                              }
                              disabled={isUpdating}
                              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Truck size={16} />

                              {isUpdating
                                ? "Updating Shipment..."
                                : selectedOrder
                                      .shipments?.[0]
                                  ? "Update Shipment"
                                  : "Save Shipment"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </section>
                )}

                {/* Order Status */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2
                      size={17}
                      className="text-gray-500"
                    />

                    <h3 className="font-semibold text-gray-900">
                      Order Status
                    </h3>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        value={
                          selectedStatuses[
                            selectedOrder.id
                          ] ??
                          selectedOrder.status
                        }
                        onChange={(event) =>
                          handleStatusChange(
                            selectedOrder.id,
                            event.target.value
                          )
                        }
                        disabled={
                          updatingOrderId ===
                          selectedOrder.id
                        }
                        className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        {orderStatuses
                          .filter(
                            (status) =>
                              status.value !==
                              "ALL"
                          )
                          .map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          ))}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(
                            selectedOrder.id,
                            selectedOrder.status
                          )
                        }
                        disabled={
                          updatingOrderId ===
                            selectedOrder.id ||
                          !selectedStatuses[
                            selectedOrder.id
                          ] ||
                          selectedStatuses[
                            selectedOrder.id
                          ] === selectedOrder.status
                        }
                        className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {updatingOrderId ===
                        selectedOrder.id
                          ? "Updating..."
                          : "Update"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default AdminOrders;