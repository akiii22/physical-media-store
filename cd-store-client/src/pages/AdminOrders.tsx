import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  updateOrderStatus,
  updateShipment,
  type ShipmentStatus,
} from "../services/orderServices";

const API_URL = "http://localhost:3000/api";

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

const getStatusClass = (status: string) => {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-yellow-100 text-yellow-800";

    case "PAYMENT_FAILED":
      return "bg-red-100 text-red-800";

    case "PAID":
      return "bg-blue-100 text-blue-800";

    case "PROCESSING":
      return "bg-purple-100 text-purple-800";

    case "READY_TO_SHIP":
      return "bg-indigo-100 text-indigo-800";

    case "SHIPPED":
      return "bg-orange-100 text-orange-800";

    case "DELIVERED":
      return "bg-green-100 text-green-800";

    case "READY_FOR_PICKUP":
      return "bg-cyan-100 text-cyan-800";

    case "PICKED_UP":
      return "bg-green-100 text-green-800";

    case "CANCELLED":
      return "bg-gray-200 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
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

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Shipment form state
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

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
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

        if (!cancelled) {
          setOrders(data.data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to retrieve orders."
          );

          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
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
      console.error("Failed to refresh orders:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to refresh orders."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // =========================================================
  // ORDER STATUS
  // =========================================================

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

  // =========================================================
  // SHIPMENT FORM
  // =========================================================

  const handleShipmentChange = (
    orderId: string,
    field:
      | "courier"
      | "tracking_number"
      | "tracking_url"
      | "status",
    value: string
  ) => {
    setShipmentForms((previous) => ({
      ...previous,
      [orderId]: {
        courier: previous[orderId]?.courier ?? "",
        tracking_number:
          previous[orderId]?.tracking_number ?? "",
        tracking_url:
          previous[orderId]?.tracking_url ?? "",
        status:
          previous[orderId]?.status ?? "PENDING",
        [field]: value,
      },
    }));
  };

  // =========================================================
  // UPDATE SHIPMENT
  // =========================================================

  const handleUpdateShipment = async (
    order: Order
  ) => {
    try {
      setUpdatingShipmentId(order.id);
      setError("");

      const existingShipment = order.shipments?.[0];
      const form = shipmentForms[order.id];

      const shipmentData = {
        courier:
          form?.courier ??
          existingShipment?.courier ??
          "",

        tracking_number:
          form?.tracking_number ??
          existingShipment?.tracking_number ??
          "",

        tracking_url:
          form?.tracking_url ??
          existingShipment?.tracking_url ??
          "",

        status:
          (form?.status ??
            existingShipment?.status ??
            "PENDING") as ShipmentStatus,
      };

      await updateShipment(
        order.id,
        shipmentData
      );

      // Update the UI immediately
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

            courier: shipmentData.courier,

            tracking_number:
              shipmentData.tracking_number,

            tracking_url:
              shipmentData.tracking_url,

            status: shipmentData.status,

            shipped_at:
              shipmentData.status === "SHIPPED"
                ? new Date().toISOString()
                : currentShipment?.shipped_at ?? null,

            delivered_at:
              shipmentData.status === "DELIVERED"
                ? new Date().toISOString()
                : currentShipment?.delivered_at ?? null,
          };

          let updatedOrderStatus =
            currentOrder.status;

          if (
            shipmentData.status ===
            "READY_TO_SHIP"
          ) {
            updatedOrderStatus = "READY_TO_SHIP";
          }

          if (
            shipmentData.status === "SHIPPED"
          ) {
            updatedOrderStatus = "SHIPPED";
          }

          if (
            shipmentData.status === "DELIVERED"
          ) {
            updatedOrderStatus = "DELIVERED";
          }

          return {
            ...currentOrder,
            status: updatedOrderStatus,
            shipments: [updatedShipment],
          };
        })
      );

      // Remove temporary form state
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

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />

          <p className="text-gray-600">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Orders
            </h1>

            <p className="mt-1 text-gray-600">
              Manage customer orders and fulfillment.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing
              ? "Refreshing..."
              : "Refresh Orders"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Payment
            </p>

            <p className="mt-1 text-3xl font-bold text-yellow-600">
              {
                orders.filter(
                  (order) =>
                    order.status ===
                    "PENDING_PAYMENT"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Processing
            </p>

            <p className="mt-1 text-3xl font-bold text-purple-600">
              {
                orders.filter(
                  (order) =>
                    order.status ===
                    "PROCESSING"
                ).length
              }
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              All Orders
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">
                No orders found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1500px]">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Delivery
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Shipment
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {orders.map((order) => {
                    const payment =
                      order.payments?.[0];

                    const shipment =
                      order.shipments?.[0];

                    const shipmentForm =
                      shipmentForms[order.id];

                    const isUpdatingShipment =
                      updatingShipmentId ===
                      order.id;

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* ORDER */}
                        <td className="px-6 py-4 align-top">
                          <p className="font-mono text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8)}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {order.order_items.length}{" "}
                            item
                            {order.order_items.length !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-6 py-4 align-top">
                          <p className="font-medium text-gray-900">
                            {order.recipient_name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {order.users?.email ??
                              "No email"}
                          </p>

                          <p className="text-xs text-gray-400">
                            {order.phone}
                          </p>
                        </td>

                        {/* TOTAL */}
                        <td className="px-6 py-4 align-top">
                          <p className="font-semibold text-gray-900">
                            ₱
                            {Number(
                              order.total_amount
                            ).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </td>

                        {/* PAYMENT */}
                        <td className="px-6 py-4 align-top">
                          {payment ? (
                            <>
                              <p className="font-medium text-gray-900">
                                {payment.method}
                              </p>

                              <span
                                className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                  payment.status ===
                                  "PAID"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status ===
                                        "FAILED"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">
                              —
                            </span>
                          )}
                        </td>

                        {/* DELIVERY */}
                        <td className="px-6 py-4 align-top">
                          <span className="text-sm text-gray-700">
                            {order.delivery_method ===
                            "STORE_PICKUP"
                              ? "Store Pickup"
                              : "Delivery"}
                          </span>

                          {order.delivery_method !==
                            "STORE_PICKUP" && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>
                                {order.city},{" "}
                                {order.province}
                              </p>

                              <p>
                                {order.barangay}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* SHIPMENT */}
                        <td className="px-6 py-4 align-top">

                          {order.delivery_method ===
                          "STORE_PICKUP" ? (
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-sm font-medium text-gray-700">
                                Store Pickup
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                No shipment required.
                              </p>
                            </div>
                          ) : (
                            <div className="w-[300px] space-y-3">

                              {/* Existing shipment info */}
                              {shipment && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">

                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">
                                      Current Shipment
                                    </span>

                                    <span
                                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                                        shipment.status
                                      )}`}
                                    >
                                      {formatStatus(
                                        shipment.status
                                      )}
                                    </span>
                                  </div>

                                  {shipment.courier && (
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Courier:
                                      </span>{" "}
                                      {shipment.courier}
                                    </p>
                                  )}

                                  {shipment.tracking_number && (
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Tracking:
                                      </span>{" "}
                                      {
                                        shipment.tracking_number
                                      }
                                    </p>
                                  )}

                                  {shipment.tracking_url && (
                                    <a
                                      href={
                                        shipment.tracking_url
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                                    >
                                      Track Package →
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Courier */}
                              <input
                                type="text"
                                placeholder="Courier"
                                value={
                                  shipmentForm?.courier ??
                                  shipment?.courier ??
                                  ""
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    order.id,
                                    "courier",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                              />

                              {/* Tracking Number */}
                              <input
                                type="text"
                                placeholder="Tracking number"
                                value={
                                  shipmentForm?.tracking_number ??
                                  shipment?.tracking_number ??
                                  ""
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    order.id,
                                    "tracking_number",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                              />

                              {/* Tracking URL */}
                              <input
                                type="url"
                                placeholder="Tracking URL"
                                value={
                                  shipmentForm?.tracking_url ??
                                  shipment?.tracking_url ??
                                  ""
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    order.id,
                                    "tracking_url",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                              />

                              {/* Shipment Status */}
                              <select
                                value={
                                  shipmentForm?.status ??
                                  shipment?.status ??
                                  "PENDING"
                                }
                                onChange={(event) =>
                                  handleShipmentChange(
                                    order.id,
                                    "status",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                                disabled={
                                  isUpdatingShipment
                                }
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

                              {/* Save */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateShipment(
                                    order
                                  )
                                }
                                disabled={
                                  isUpdatingShipment
                                }
                                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdatingShipment
                                  ? "Updating Shipment..."
                                  : shipment
                                    ? "Update Shipment"
                                    : "Save Shipment"}
                              </button>

                            </div>
                          )}
                        </td>

                        {/* ORDER STATUS */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex min-w-[170px] flex-col gap-2">

                            <span
                              className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {formatStatus(
                                order.status
                              )}
                            </span>

                            <select
                              value={
                                selectedStatuses[
                                  order.id
                                ] ??
                                order.status
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  order.id,
                                  event.target.value
                                )
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              disabled={
                                updatingOrderId ===
                                order.id
                              }
                            >
                              <option value="PENDING_PAYMENT">
                                Pending Payment
                              </option>

                              <option value="PAYMENT_FAILED">
                                Payment Failed
                              </option>

                              <option value="PAID">
                                Paid
                              </option>

                              <option value="PROCESSING">
                                Processing
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

                              <option value="READY_FOR_PICKUP">
                                Ready for Pickup
                              </option>

                              <option value="PICKED_UP">
                                Picked Up
                              </option>

                              <option value="CANCELLED">
                                Cancelled
                              </option>
                            </select>

                            {selectedStatuses[
                              order.id
                            ] &&
                              selectedStatuses[
                                order.id
                              ] !== order.status && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      order.id,
                                      order.status
                                    )
                                  }
                                  disabled={
                                    updatingOrderId ===
                                    order.id
                                  }
                                  className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                                >
                                  {updatingOrderId ===
                                  order.id
                                    ? "Updating..."
                                    : "Update Status"}
                                </button>
                              )}
                          </div>
                        </td>

                        {/* DATE */}
                        <td className="px-6 py-4 align-top text-sm text-gray-500">
                          {formatDate(
                            order.created_at
                          )}
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
  );
};

export default AdminOrders;