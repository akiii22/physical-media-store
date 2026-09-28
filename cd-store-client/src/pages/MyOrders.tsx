import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

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

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const formatStatus = (status: string) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "DELIVERED":
    case "PICKED_UP":
      return CheckCircle2;

    case "SHIPPED":
      return Truck;

    case "PROCESSING":
    case "READY_TO_SHIP":
    case "READY_FOR_PICKUP":
      return Package;

    case "PENDING_PAYMENT":
      return Clock3;

    default:
      return Package;
  }
};

const getPaymentClass = (status: string) => {
  switch (status) {
    case "PAID":
      return "text-green-600";

    case "FAILED":
      return "text-red-600";

    default:
      return "text-yellow-600";
  }
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ==========================================================
   * LOAD ORDERS
   * ==========================================================
   */

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

        const response = await fetch(`${API_URL}/orders/my`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

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
        console.error("Failed to load customer orders:", err);

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

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-9 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="space-y-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>

                  <div className="h-7 w-24 animate-pulse rounded-full bg-gray-100" />
                </div>

                <div className="grid gap-6 px-6 py-6 sm:grid-cols-3">
                  <div>
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-6 w-28 animate-pulse rounded bg-gray-200" />
                  </div>

                  <div>
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-5 w-24 animate-pulse rounded bg-gray-200" />
                  </div>

                  <div>
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-5 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>

                <div className="h-16 animate-pulse border-t border-gray-100 bg-gray-50" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Account
          </p>

          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                My Orders
              </h1>

              <p className="mt-2 text-gray-600">
                View your purchases and track your orders.
              </p>
            </div>

            {orders.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
                <ShoppingBag className="h-4 w-4" />
                {orders.length}{" "}
                {orders.length === 1 ? "order" : "orders"}
              </div>
            )}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="font-bold text-red-600">
                  !
                </span>
              </div>

              <div>
                <p className="font-semibold text-red-900">
                  Unable to load your orders
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-8 w-8 text-gray-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              You haven't placed an order yet. Browse our
              collection and find something you like.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ORDERS */}
        {!error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const payment = order.payments?.[0];
              const shipment = order.shipments?.[0];

              const StatusIcon = getStatusIcon(order.status);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* ORDER HEADER */}
                  <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-semibold text-gray-900">
                            Order #{order.id.slice(0, 8)}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <StatusIcon className="h-4 w-4 text-gray-700" />
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ORDER SUMMARY */}
                  <div className="grid gap-6 px-5 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
                    {/* TOTAL */}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Order Total
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>

                    {/* PAYMENT */}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Payment
                      </p>

                      {payment ? (
                        <div className="mt-1 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />

                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.method}
                            </p>

                            <p
                              className={`text-sm ${getPaymentClass(
                                payment.status
                              )}`}
                            >
                              {formatStatus(payment.status)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-gray-400">
                          No payment information
                        </p>
                      )}
                    </div>

                    {/* DELIVERY */}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Delivery
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        {order.delivery_method ===
                        "STORE_PICKUP" ? (
                          <Package className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Truck className="h-4 w-4 text-gray-400" />
                        )}

                        <p className="font-medium text-gray-900">
                          {order.delivery_method ===
                          "STORE_PICKUP"
                            ? "Store Pickup"
                            : "Delivery"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SHIPMENT */}
                  {shipment && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Truck className="h-5 w-5 text-gray-600" />
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Shipment
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {shipment.courier && (
                                <p className="font-medium text-gray-900">
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
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <span
                            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                              shipment.status
                            )}`}
                          >
                            {formatStatus(shipment.status)}
                          </span>

                          {shipment.tracking_url && (
                            <a
                              href={shipment.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                            >
                              Track Package
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ShoppingBag className="h-4 w-4" />

                      {order.order_items.length}{" "}
                      {order.order_items.length === 1
                        ? "item"
                        : "items"}
                    </div>

                    <Link
                      to={`/my-orders/${order.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
                    >
                      View Order
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrders;