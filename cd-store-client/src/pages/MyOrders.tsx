import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:3000/api";

type Order = {
  id: string;
  status: string;
  total_amount: number;
  delivery_method: string;
  recipient_name: string;
  created_at: string;

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

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/orders/my`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to retrieve your orders."
          );
        }

        if (!cancelled) {
          setOrders(data.data ?? []);
        }
      } catch (err) {
        console.error(
          "Failed to load customer orders:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to retrieve your orders."
          );
        }
      } finally {
        if (!cancelled) {
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
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="text-gray-500">
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Account
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            My Orders
          </h1>

          <p className="mt-2 text-gray-600">
            View your orders and track your purchases.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!error && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7H4m16 0-2 12H6L4 7m4 0V5a2 2 0 012-2h4a2 2 0 012 2v2"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              You haven't placed an order yet. Browse our
              collection and find something you like.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Orders */}
        <div className="space-y-5">

          {orders.map((order) => {
            const payment = order.payments?.[0];
            const shipment = order.shipments?.[0];

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >

                {/* Order Header */}
                <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                {/* Order Body */}
                <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">

                  {/* Total */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Order Total
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-900">
                      ₱
                      {Number(
                        order.total_amount
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Payment */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Payment
                    </p>

                    {payment ? (
                      <div className="mt-1">
                        <p className="font-medium text-gray-900">
                          {payment.method}
                        </p>

                        <p
                          className={`text-sm ${
                            payment.status === "PAID"
                              ? "text-green-600"
                              : payment.status === "FAILED"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {payment.status}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-400">
                        No payment information
                      </p>
                    )}
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Delivery
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {order.delivery_method ===
                      "STORE_PICKUP"
                        ? "Store Pickup"
                        : "Delivery"}
                    </p>
                  </div>
                </div>

                {/* Shipment */}
                {shipment && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 sm:px-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Shipment
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">

                          {shipment.courier && (
                            <p className="text-sm font-medium text-gray-900">
                              {shipment.courier}
                            </p>
                          )}

                          {shipment.tracking_number && (
                            <p className="font-mono text-sm text-gray-600">
                              {shipment.tracking_number}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                          shipment.status
                        )}`}
                      >
                        {formatStatus(
                          shipment.status
                        )}
                      </span>
                    </div>

                    {shipment.tracking_url && (
                      <a
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Track Package →
                      </a>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  <p className="text-sm text-gray-500">
                    {order.order_items.length}{" "}
                    {order.order_items.length === 1
                      ? "item"
                      : "items"}
                  </p>

                  <Link
                    to={`/my-orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    View Order
                  </Link>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default MyOrders;