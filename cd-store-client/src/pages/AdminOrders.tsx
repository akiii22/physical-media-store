import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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
  updateDeliveryFee,
  type OrderStatus,
  type ShipmentStatus,
} from "../services/orderServices";

const API_URL = import.meta.env.VITE_API_URL;

type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
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

  delivery_fee: number;
  delivery_fee_status: string;

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
    payment_type: "PRODUCT" | "DELIVERY";
    proof_url: string | null;
    provider_reference: string | null;
    paid_at: string | null;
  }[];
  shipments: {
    id: string;
    courier: string | null;
    tracking_number: string | null;
    status: ShipmentStatus;
    tracking_url: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
  }[];
};

type OrderFilter = "ALL" | OrderStatus;
type DeliveryFilter =
  | "ALL"
  | "DELIVERY"
  | "SAME_DAY"
  | "STORE_PICKUP";

const orderStatuses: {
  value: OrderFilter;
  label: string;
}[] = [
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

const money = (value: number) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatStatus = (status: string) =>
  status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200/60",
    PAYMENT_FAILED: "bg-rose-50 text-rose-700 border-rose-200/60",
    PAID: "bg-blue-50 text-blue-700 border-blue-200/60",
    PROCESSING: "bg-violet-50 text-violet-700 border-violet-200/60",
    READY_TO_SHIP: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    SHIPPED: "bg-orange-50 text-orange-700 border-orange-200/60",
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    READY_FOR_PICKUP: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    PICKED_UP: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return classes[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
};

const paymentClass = (status: string) => {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  }

  if (status === "FAILED") {
    return "bg-rose-50 text-rose-700 border-rose-200/60";
  }

  return "bg-amber-50 text-amber-700 border-amber-200/60";
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<OrderFilter>("ALL");
  const [deliveryFilter, setDeliveryFilter] =
    useState<DeliveryFilter>("ALL");

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<string, OrderStatus>>({});

  const [deliveryFees, setDeliveryFees] =
    useState<Record<string, string>>({});

  const [shipmentForms, setShipmentForms] =
    useState<Record<string, {
      courier: string;
      tracking_number: string;
      tracking_url: string;
      status: ShipmentStatus;
    }>>({});

  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
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
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to retrieve orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.recipient_name
          .toLowerCase()
          .includes(query) ||
        order.users?.email
          ?.toLowerCase()
          .includes(query) ||
        order.phone.includes(query);

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

  const stats = {
    total: orders.length,
    pending: orders.filter(
      (o) => o.status === "PENDING_PAYMENT"
    ).length,
    processing: orders.filter(
      (o) => o.status === "PROCESSING"
    ).length,
    ready: orders.filter(
      (o) => o.status === "READY_TO_SHIP"
    ).length,
    completed: orders.filter(
      (o) =>
        o.status === "DELIVERED" ||
        o.status === "PICKED_UP"
    ).length,
  };

  const updateStatus = async (order: Order) => {
    const newStatus = selectedStatuses[order.id];

    if (!newStatus || newStatus === order.status) {
      return;
    }

    try {
      setBusyId(order.id);

      await updateOrderStatus(
        order.id,
        newStatus
      );

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedOrder((previous) =>
        previous?.id === order.id
          ? { ...previous, status: newStatus }
          : previous
      );

      setSelectedStatuses((previous) => {
        const updated = { ...previous };
        delete updated[order.id];
        return updated;
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      );
    } finally {
      setBusyId(null);
    }
  };

  const saveDeliveryFee = async (order: Order) => {
    const value = Number(
      deliveryFees[order.id] ??
        order.delivery_fee ??
        0
    );

    if (!Number.isFinite(value) || value < 0) {
      setError("Delivery fee must be a valid amount.");
      return;
    }

    try {
      setBusyId(order.id);

      const updated = await updateDeliveryFee(
        order.id,
        value
      );

      const patch = {
        delivery_fee: Number(updated.delivery_fee),
        delivery_fee_status:
          updated.delivery_fee_status,
        updated_at: updated.updated_at,
      };

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? { ...item, ...patch }
            : item
        )
      );

      setSelectedOrder((previous) =>
        previous?.id === order.id
          ? { ...previous, ...patch }
          : previous
      );

      setDeliveryFees((previous) => {
        const updatedFees = { ...previous };
        delete updatedFees[order.id];
        return updatedFees;
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update delivery fee."
      );
    } finally {
      setBusyId(null);
    }
  };

  const getShipmentForm = (order: Order) => {
    return (
      shipmentForms[order.id] ?? {
        courier: order.shipments?.[0]?.courier ?? "",
        tracking_number:
          order.shipments?.[0]?.tracking_number ?? "",
        tracking_url:
          order.shipments?.[0]?.tracking_url ?? "",
        status:
          order.shipments?.[0]?.status ?? "PENDING",
      }
    );
  };

  const saveShipment = async (order: Order) => {
    const form = getShipmentForm(order);

    try {
      setBusyId(order.id);

      await updateShipment(order.id, form);

      const current = order.shipments?.[0];

      const shipment = {
        id: current?.id ?? `temp-${order.id}`,
        courier: form.courier,
        tracking_number: form.tracking_number,
        tracking_url: form.tracking_url,
        status: form.status,
        shipped_at:
          form.status === "SHIPPED"
            ? new Date().toISOString()
            : current?.shipped_at ?? null,
        delivered_at:
          form.status === "DELIVERED"
            ? new Date().toISOString()
            : current?.delivered_at ?? null,
      };

      let newStatus = order.status;

      if (form.status === "READY_TO_SHIP") {
        newStatus = "READY_TO_SHIP";
      }

      if (form.status === "SHIPPED") {
        newStatus = "SHIPPED";
      }

      if (form.status === "DELIVERED") {
        newStatus = "DELIVERED";
      }

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: newStatus,
                shipments: [shipment],
              }
            : item
        )
      );

      setSelectedOrder((previous) =>
        previous?.id === order.id
          ? {
              ...previous,
              status: newStatus,
              shipments: [shipment],
            }
          : previous
      );

      setShipmentForms((previous) => {
        const updated = { ...previous };
        delete updated[order.id];
        return updated;
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update shipment."
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-3">
        <RefreshCw size={24} className="animate-spin text-slate-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading orders...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 text-slate-900">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Store Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-slate-900">
              Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer orders, payments, and fulfillment.
            </p>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700 shadow-sm backdrop-blur-sm">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="rounded-lg p-1 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats */}

        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["ALL", "Total Orders", stats.total],
            [
              "PENDING_PAYMENT",
              "Pending",
              stats.pending,
            ],
            [
              "PROCESSING",
              "Processing",
              stats.processing,
            ],
            [
              "READY_TO_SHIP",
              "Ready to Ship",
              stats.ready,
            ],
            [
              "DELIVERED",
              "Completed",
              stats.completed,
            ],
          ].map(([value, label, count]) => (
            <button
              key={value}
              onClick={() =>
                setStatusFilter(
                  value as OrderFilter
                )
              }
              className={`rounded-2xl border p-4 text-left shadow-sm transition-all active:scale-[0.98] ${
                statusFilter === value
                  ? "border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-md"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <span className="text-xs font-medium text-slate-500">
                {label}
              </span>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {count}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}

        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search order ID, customer, email, or phone..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as OrderFilter
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 lg:w-52"
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

            <select
              value={deliveryFilter}
              onChange={(e) =>
                setDeliveryFilter(
                  e.target.value as DeliveryFilter
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 lg:w-48"
            >
              <option value="ALL">
                All fulfillment
              </option>

              <option value="DELIVERY">
                Nationwide Delivery
              </option>

              <option value="SAME_DAY">
                Same-Day Lalamove
              </option>

              <option value="STORE_PICKUP">
                Store Pickup
              </option>
            </select>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Showing{" "}
            <b className="font-semibold text-slate-900">{filteredOrders.length}</b> of{" "}
            <b className="font-semibold text-slate-900">{orders.length}</b> orders
          </p>
        </div>

        {/* Orders Table */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Package className="mb-2 text-slate-300" size={32} />
              <p className="text-sm font-medium text-slate-500">
                No orders found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Fulfillment</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.map((order) => {
                    const productPayment = order.payments?.find(
                      (payment) => payment.payment_type === "PRODUCT"
                    );

                    const deliveryPayment = order.payments?.find(
                      (payment) => payment.payment_type === "DELIVERY"
                    );

                    const shipment =
                      order.shipments?.[0];

                    const productTotal =
                      Number(order.total_amount);

                    const deliveryFee =
                      Number(order.delivery_fee || 0);

                    const grandTotal =
                      productTotal + deliveryFee;

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4 align-top">
                          <p className="font-mono text-xs font-bold text-slate-900">
                            #{order.id.slice(0, 8)}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400 font-medium">
                            {order.order_items.length}{" "}
                            {order.order_items.length === 1
                              ? "item"
                              : "items"}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="font-medium text-slate-900">
                            {order.recipient_name}
                          </p>

                          <p className="max-w-[180px] truncate text-xs text-slate-500 mt-0.5">
                            {order.users?.email}
                          </p>
                        </td>

                        {/* TOTAL */}

                        <td className="px-5 py-4 align-top">
                          <p className="font-bold text-slate-900">
                            {money(grandTotal)}
                          </p>

                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Products: {money(productTotal)}
                          </p>

                          {deliveryFee > 0 && (
                            <p className="text-[11px] text-slate-500">
                              Delivery: {money(deliveryFee)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="space-y-2">
                            {productPayment && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Product
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-slate-700">
                                    {productPayment.method}
                                  </span>

                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${paymentClass(
                                      productPayment.status
                                    )}`}
                                  >
                                    {productPayment.status}
                                  </span>
                                </div>
                              </div>
                            )}

                            {deliveryPayment && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Delivery
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-slate-700">
                                    {deliveryPayment.method}
                                  </span>

                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${paymentClass(
                                      deliveryPayment.status
                                    )}`}
                                  >
                                    {deliveryPayment.status}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!productPayment && !deliveryPayment && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            {order.delivery_method ===
                            "STORE_PICKUP" ? (
                              <MapPin size={14} className="text-slate-400" />
                            ) : (
                              <Truck size={14} className="text-slate-400" />
                            )}

                            <span>
                              {order.delivery_method ===
                              "SAME_DAY"
                                ? "Same-Day"
                                : order.delivery_method ===
                                  "STORE_PICKUP"
                                  ? "Store Pickup"
                                  : "Delivery"}
                            </span>
                          </div>

                          {shipment?.tracking_number && (
                            <p className="mt-1 font-mono text-[11px] text-slate-400">
                              {shipment.tracking_number}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top text-xs text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <CalendarDays
                              size={13}
                              className="text-slate-400"
                            />

                            <span>
                              {new Date(
                                order.created_at
                              ).toLocaleDateString(
                                "en-PH"
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-right">
                          <button
                            onClick={() =>
                              setSelectedOrder(order)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95"
                          >
                            View
                            <ArrowRight size={13} />
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

      {/* DRAWER */}

      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() =>
              !busyId && setSelectedOrder(null)
            }
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Order Details
                </p>

                <h2 className="font-mono text-lg font-bold text-slate-900">
                  #{selectedOrder.id.slice(0, 8)}
                </h2>

                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {new Date(
                    selectedOrder.created_at
                  ).toLocaleString("en-PH")}
                </p>
              </div>

              <button
                onClick={() =>
                  !busyId &&
                  setSelectedOrder(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-6">

                {/* Customer */}

                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <User size={15} className="text-slate-400" />
                    Customer
                  </h3>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-1">
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.recipient_name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selectedOrder.users?.email}
                    </p>

                    <p className="text-xs text-slate-500 font-mono">
                      {selectedOrder.phone}
                    </p>
                  </div>
                </section>

                {/* Items + Total */}

                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <ShoppingBag size={15} className="text-slate-400" />
                    Order Items
                  </h3>

                  <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                    <div className="divide-y divide-slate-100">
                      {selectedOrder.order_items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3.5 text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-800">
                                Quantity: {item.quantity}
                              </p>

                              <p className="font-mono text-xs text-slate-400">
                                ID: {item.product_id.slice(
                                  0,
                                  8
                                )}
                              </p>
                            </div>

                            <b className="font-semibold text-slate-900">
                              {money(
                                item.unit_price *
                                  item.quantity
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>

                    <div className="space-y-2 bg-slate-50/80 border-t border-slate-100 p-4 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Products</span>
                        <b className="font-semibold text-slate-900">
                          {money(
                            selectedOrder.total_amount
                          )}
                        </b>
                      </div>

                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <b className="font-semibold text-slate-900">
                          {selectedOrder.delivery_method ===
                          "STORE_PICKUP"
                            ? "Free"
                            : money(
                                selectedOrder.delivery_fee
                              )}
                        </b>
                      </div>

                      <div className="flex justify-between border-t border-slate-200/80 pt-2.5 text-base font-bold text-slate-900">
                        <span>Total</span>

                        <span>
                          {money(
                            Number(
                              selectedOrder.total_amount
                            ) +
                              Number(
                                selectedOrder.delivery_fee ||
                                  0
                              )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment */}

                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CreditCard size={15} className="text-slate-400" />
                    Payments
                  </h3>

                  <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4">
                    {selectedOrder.payments?.length ? (
                      selectedOrder.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                  {payment.payment_type === "PRODUCT"
                                    ? "Product Payment"
                                    : "Delivery Payment"}
                                </span>
                              </div>

                              <p className="mt-2 font-semibold text-slate-900">
                                {payment.method}
                              </p>

                              <p className="text-xs font-medium text-slate-500 mt-0.5">
                                {money(payment.amount)}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${paymentClass(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </div>

                          {payment.proof_url && (
                            <a
                              href={payment.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-block text-xs font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2"
                            >
                              View Payment Proof →
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">
                        No payment information.
                      </p>
                    )}
                  </div>
                </section>

                {/* Delivery */}

                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {selectedOrder.delivery_method ===
                    "STORE_PICKUP" ? (
                      <MapPin size={15} className="text-slate-400" />
                    ) : (
                      <Truck size={15} className="text-slate-400" />
                    )}

                    Fulfillment
                  </h3>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.delivery_method ===
                      "STORE_PICKUP"
                        ? "Store Pickup"
                        : selectedOrder.delivery_method ===
                          "SAME_DAY"
                          ? "Same-Day Lalamove"
                          : "Nationwide Delivery"}
                    </p>

                    {selectedOrder.delivery_method !==
                      "STORE_PICKUP" && (
                      <>
                        <div className="mt-2 text-xs leading-relaxed text-slate-500">
                          {selectedOrder.street_address}
                          <br />
                          {selectedOrder.barangay},{" "}
                          {selectedOrder.city}
                          <br />
                          {selectedOrder.province}{" "}
                          {selectedOrder.postal_code}
                        </div>

                        <div className="mt-4 rounded-lg bg-slate-50/80 border border-slate-200/60 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Delivery Fee
                          </p>

                          <p className="font-bold text-slate-900 mt-0.5">
                            {money(
                              selectedOrder.delivery_fee
                            )}
                          </p>

                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            Status:{" "}
                            {selectedOrder.delivery_fee_status ===
                            "PENDING"
                              ? "Awaiting payment"
                              : selectedOrder.delivery_fee_status ===
                                "PAID"
                                ? "Paid"
                                : "Not set"}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                deliveryFees[
                                  selectedOrder.id
                                ] ??
                                String(
                                  selectedOrder.delivery_fee ??
                                    0
                                )
                              }
                              onChange={(e) =>
                                setDeliveryFees(
                                  (previous) => ({
                                    ...previous,
                                    [selectedOrder.id]:
                                      e.target.value,
                                  })
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                            />

                            <button
                              onClick={() =>
                                saveDeliveryFee(
                                  selectedOrder
                                )
                              }
                              disabled={
                                busyId ===
                                selectedOrder.id
                              }
                              className="rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                            >
                              {busyId ===
                              selectedOrder.id
                                ? "Saving..."
                                : "Save"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Shipment */}

                {selectedOrder.delivery_method !==
                  "STORE_PICKUP" && (
                  <section>
                    <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Package size={15} className="text-slate-400" />
                      Shipment
                    </h3>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4">
                      {(
                        [
                          "courier",
                          "tracking_number",
                          "tracking_url",
                        ] as const
                      ).map((field) => (
                        <input
                          key={field}
                          value={
                            getShipmentForm(
                              selectedOrder
                            )[field]
                          }
                          onChange={(e) =>
                            setShipmentForms(
                              (previous) => ({
                                ...previous,
                                [selectedOrder.id]: {
                                  ...getShipmentForm(
                                    selectedOrder
                                  ),
                                  [field]:
                                    e.target.value,
                                },
                              })
                            )
                          }
                          placeholder={field.replaceAll(
                            "_",
                            " "
                          )}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:capitalize placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                        />
                      ))}

                      <select
                        value={
                          getShipmentForm(
                            selectedOrder
                          ).status
                        }
                        onChange={(e) =>
                          setShipmentForms(
                            (previous) => ({
                              ...previous,
                              [selectedOrder.id]: {
                                ...getShipmentForm(
                                  selectedOrder
                                ),
                                status:
                                  e.target
                                    .value as ShipmentStatus,
                              },
                            })
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                      >
                        {[
                          "PENDING",
                          "READY_TO_SHIP",
                          "SHIPPED",
                          "DELIVERED",
                        ].map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          saveShipment(selectedOrder)
                        }
                        disabled={
                          busyId === selectedOrder.id
                        }
                        className="w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                      >
                        {busyId === selectedOrder.id
                          ? "Updating..."
                          : "Save Shipment"}
                      </button>
                    </div>
                  </section>
                )}

                {/* Order Status */}

                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CheckCircle2 size={15} className="text-slate-400" />
                    Order Status
                  </h3>

                  <div className="flex gap-2 rounded-xl border border-slate-200/80 bg-white p-4">
                    <select
                      value={
                        selectedStatuses[
                          selectedOrder.id
                        ] ?? selectedOrder.status
                      }
                      onChange={(e) =>
                        setSelectedStatuses(
                          (previous) => ({
                            ...previous,
                            [selectedOrder.id]:
                              e.target
                                .value as OrderStatus,
                          })
                        )
                      }
                      className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                    >
                      {orderStatuses
                        .filter(
                          (item) =>
                            item.value !== "ALL"
                        )
                        .map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                          >
                            {item.label}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() =>
                        updateStatus(selectedOrder)
                      }
                      disabled={
                        busyId === selectedOrder.id ||
                        !selectedStatuses[
                          selectedOrder.id
                        ] ||
                        selectedStatuses[
                          selectedOrder.id
                        ] === selectedOrder.status
                      }
                      className="rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                    >
                      Update
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default AdminOrders;