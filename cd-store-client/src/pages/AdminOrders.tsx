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
    PENDING_PAYMENT: "bg-amber-50 text-amber-700",
    PAYMENT_FAILED: "bg-red-50 text-red-700",
    PAID: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-violet-50 text-violet-700",
    READY_TO_SHIP: "bg-indigo-50 text-indigo-700",
    SHIPPED: "bg-orange-50 text-orange-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    READY_FOR_PICKUP: "bg-cyan-50 text-cyan-700",
    PICKED_UP: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return classes[status] ?? "bg-gray-100 text-gray-600";
};

const paymentClass = (status: string) => {
  if (status === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "FAILED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
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
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading orders...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Store Management
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Orders
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage customer orders, payments, and fulfillment.
            </p>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>

            <button onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* Stats */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm ${
                statusFilter === value
                  ? "border-gray-900 ring-1 ring-gray-900"
                  : "border-gray-200"
              }`}
            >
              <span className="text-sm text-gray-500">
                {label}
              </span>

              <p className="mt-3 text-2xl font-bold">
                {count}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}

        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search order ID, customer, email, or phone..."
                className="h-11 w-full rounded-xl border bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-gray-900 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as OrderFilter
                )
              }
              className="h-11 rounded-xl border bg-gray-50 px-4 text-sm lg:w-52"
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
              className="h-11 rounded-xl border bg-gray-50 px-4 text-sm lg:w-48"
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

          <p className="mt-3 text-xs text-gray-500">
            Showing{" "}
            <b>{filteredOrders.length}</b> of{" "}
            <b>{orders.length}</b> orders
          </p>
        </div>

        {/* Orders */}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-sm text-gray-500">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Fulfillment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredOrders.map((order) => {
                    const payment =
                      order.payments?.[0];

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
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-5">
                          <p className="font-mono text-sm font-semibold">
                            #{order.id.slice(0, 8)}
                          </p>

                          <p className="text-xs text-gray-400">
                            {order.order_items.length}{" "}
                            {order.order_items.length === 1
                              ? "item"
                              : "items"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-medium">
                            {order.recipient_name}
                          </p>

                          <p className="max-w-[180px] truncate text-xs text-gray-500">
                            {order.users?.email}
                          </p>
                        </td>

                        {/* UPDATED TOTAL */}

                        <td className="px-5 py-5">
                          <p className="font-semibold">
                            {money(grandTotal)}
                          </p>

                          <p className="text-xs text-gray-500">
                            Products: {money(productTotal)}
                          </p>

                          {deliveryFee > 0 && (
                            <p className="text-xs text-gray-500">
                              Delivery: {money(deliveryFee)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          {payment ? (
                            <>
                              <p className="text-sm">
                                {payment.method}
                              </p>

                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${paymentClass(
                                  payment.status
                                )}`}
                              >
                                {payment.status}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            {order.delivery_method ===
                            "STORE_PICKUP" ? (
                              <MapPin size={15} />
                            ) : (
                              <Truck size={15} />
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
                            <p className="text-xs text-gray-400">
                              {shipment.tracking_number}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass(
                              order.status
                            )}`}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-xs text-gray-500">
                          <CalendarDays
                            size={14}
                            className="mr-1 inline"
                          />

                          {new Date(
                            order.created_at
                          ).toLocaleDateString(
                            "en-PH"
                          )}
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            onClick={() =>
                              setSelectedOrder(order)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-900 hover:text-white"
                          >
                            View
                            <ArrowRight size={14} />
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
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() =>
              !busyId && setSelectedOrder(null)
            }
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex justify-between border-b p-5">
              <div>
                <p className="text-xs uppercase text-gray-400">
                  Order
                </p>

                <h2 className="font-mono text-lg font-bold">
                  #{selectedOrder.id.slice(0, 8)}
                </h2>

                <p className="text-xs text-gray-500">
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
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-6">

                {/* Customer */}

                <section>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <User size={17} />
                    Customer
                  </h3>

                  <div className="rounded-xl border bg-gray-50 p-4">
                    <p className="font-medium">
                      {selectedOrder.recipient_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedOrder.users?.email}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedOrder.phone}
                    </p>
                  </div>
                </section>

                {/* Items + Total */}

                <section>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <ShoppingBag size={17} />
                    Order Items
                  </h3>

                  <div className="divide-y rounded-xl border">
                    {selectedOrder.order_items.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex justify-between p-4 text-sm"
                        >
                          <span>
                            Quantity: {item.quantity}

                            <p className="font-mono text-xs text-gray-400">
                              {item.product_id.slice(
                                0,
                                8
                              )}
                            </p>
                          </span>

                          <b>
                            {money(
                              item.unit_price *
                                item.quantity
                            )}
                          </b>
                        </div>
                      )
                    )}

                    <div className="space-y-2 bg-gray-50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span>Products</span>
                        <b>
                          {money(
                            selectedOrder.total_amount
                          )}
                        </b>
                      </div>

                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <b>
                          {selectedOrder.delivery_method ===
                          "STORE_PICKUP"
                            ? "Free"
                            : money(
                                selectedOrder.delivery_fee
                              )}
                        </b>
                      </div>

                      <div className="flex justify-between border-t pt-2 text-base">
                        <b>Total</b>

                        <b>
                          {money(
                            Number(
                              selectedOrder.total_amount
                            ) +
                              Number(
                                selectedOrder.delivery_fee ||
                                  0
                              )
                          )}
                        </b>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment */}

                <section>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <CreditCard size={17} />
                    Payment
                  </h3>

                  <div className="rounded-xl border p-4">
                    {selectedOrder.payments?.[0] ? (
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {
                              selectedOrder
                                .payments[0].method
                            }
                          </p>

                          <p className="text-sm text-gray-500">
                            {money(
                              selectedOrder
                                .payments[0].amount
                            )}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${paymentClass(
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
                    ) : (
                      <p className="text-sm text-gray-500">
                        No payment information.
                      </p>
                    )}

                    {selectedOrder.payments?.[0]
                      ?.proof_url && (
                      <a
                        href={
                          selectedOrder
                            .payments[0]
                            .proof_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-blue-600"
                      >
                        View Payment Proof →
                      </a>
                    )}
                  </div>
                </section>

                {/* Delivery */}

                <section>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    {selectedOrder.delivery_method ===
                    "STORE_PICKUP" ? (
                      <MapPin size={17} />
                    ) : (
                      <Truck size={17} />
                    )}

                    Fulfillment
                  </h3>

                  <div className="rounded-xl border p-4">
                    <p className="font-medium">
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
                        <div className="mt-3 text-sm text-gray-500">
                          {selectedOrder.street_address}
                          <br />
                          {selectedOrder.barangay},{" "}
                          {selectedOrder.city}
                          <br />
                          {selectedOrder.province}{" "}
                          {selectedOrder.postal_code}
                        </div>

                        <div className="mt-4 rounded-lg bg-gray-50 p-3">
                          <p className="text-xs uppercase text-gray-500">
                            Delivery Fee
                          </p>

                          <p className="font-semibold">
                            {money(
                              selectedOrder.delivery_fee
                            )}
                          </p>

                          <p className="text-xs text-gray-500">
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
                              className="w-full rounded-lg border px-3 py-2 text-sm"
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
                              className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
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
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <Package size={17} />
                      Shipment
                    </h3>

                    <div className="space-y-3 rounded-xl border p-4">
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
                          className="w-full rounded-lg border px-3 py-2.5 text-sm"
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
                        className="w-full rounded-lg border px-3 py-2.5 text-sm"
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
                        className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={17} />
                    Order Status
                  </h3>

                  <div className="flex gap-2 rounded-xl border p-4">
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
                      className="h-11 flex-1 rounded-lg border px-3 text-sm"
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
                      className="rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white disabled:opacity-40"
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