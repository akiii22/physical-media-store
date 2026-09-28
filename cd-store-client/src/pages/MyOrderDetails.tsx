import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Store,
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
  phone: string;
  province: string | null;
  city: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;

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
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
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

const getPaymentClass = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700";

    case "FAILED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

const MyOrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * ==========================================================
   * LOAD ORDER
   * ==========================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!orderId) {
          throw new Error("Order ID is missing.");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        /*
         * We use /orders/my here and find the requested order.
         * The endpoint already returns only the authenticated
         * customer's orders.
         */
        const response = await fetch(`${API_URL}/orders/my`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to retrieve your order."
          );
        }

        const foundOrder = data.data?.find(
          (item: Order) => item.id === orderId
        );

        if (!foundOrder) {
          throw new Error(
            "Order not found or you do not have permission to view it."
          );
        }

        if (!cancelled) {
          setOrder(foundOrder);
        }
      } catch (err) {
        console.error("Failed to load order details:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to retrieve your order."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-7 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-56 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-8 space-y-7">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex gap-4"
                >
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200" />

                  <div className="flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-64 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="font-bold text-red-600">
                  !
                </span>
              </div>

              <div>
                <h1 className="font-semibold text-red-900">
                  Unable to load order
                </h1>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {error || "Order not found."}
                </p>
              </div>
            </div>

            <Link
              to="/my-orders"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ORDER DATA
   * ============================================================
   */

  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];

  const isPickup =
    order.delivery_method === "STORE_PICKUP";

  /*
   * ============================================================
   * STATUS STEPS
   * ============================================================
   */

  const deliverySteps = [
    {
      key: "ORDER_PLACED",
      label: "Order Placed",
      description:
        "Your order has been successfully created.",
      icon: ShoppingBag,
    },
    {
      key: "PAYMENT",
      label: "Payment Confirmed",
      description:
        "Your payment has been confirmed.",
      icon: CreditCard,
    },
    {
      key: "PROCESSING",
      label: "Processing",
      description:
        "Your order is being prepared.",
      icon: Package,
    },
    {
      key: "READY_TO_SHIP",
      label: "Ready to Ship",
      description:
        "Your package is ready to be handed to the courier.",
      icon: Package,
    },
    {
      key: "SHIPPED",
      label: "Shipped",
      description:
        "Your package is on its way.",
      icon: Truck,
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      description:
        "Your package has been delivered.",
      icon: CheckCircle2,
    },
  ];

  const pickupSteps = [
    {
      key: "ORDER_PLACED",
      label: "Order Placed",
      description:
        "Your order has been successfully created.",
      icon: ShoppingBag,
    },
    {
      key: "PAYMENT",
      label: "Payment Confirmed",
      description:
        "Your payment has been confirmed.",
      icon: CreditCard,
    },
    {
      key: "PROCESSING",
      label: "Processing",
      description:
        "Your order is being prepared.",
      icon: Package,
    },
    {
      key: "READY_FOR_PICKUP",
      label: "Ready for Pickup",
      description:
        "Your order is ready to be picked up.",
      icon: Store,
    },
    {
      key: "PICKED_UP",
      label: "Picked Up",
      description:
        "Your order has been picked up.",
      icon: CheckCircle2,
    },
  ];

  const steps = isPickup ? pickupSteps : deliverySteps;

  /*
   * ============================================================
   * CURRENT STEP
   * ============================================================
   */

  const getStepIndex = () => {
    if (isPickup) {
      switch (order.status) {
        case "PENDING_PAYMENT":
          return 0;

        case "PAID":
          return 1;

        case "PROCESSING":
          return 2;

        case "READY_FOR_PICKUP":
          return 3;

        case "PICKED_UP":
          return 4;

        default:
          return 0;
      }
    }

    switch (order.status) {
      case "PENDING_PAYMENT":
        return 0;

      case "PAID":
        return 1;

      case "PROCESSING":
        return 2;

      case "READY_TO_SHIP":
        return 3;

      case "SHIPPED":
        return 4;

      case "DELIVERED":
        return 5;

      default:
        return 0;
    }
  };

  const currentStep = getStepIndex();

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-4xl">

        {/* BACK */}
        <Link
          to="/my-orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Orders
        </Link>

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Order Details
              </p>

              <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-gray-900">
                #{order.id.slice(0, 8)}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Clock3 className="h-4 w-4" />
                Placed {formatDate(order.created_at)}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${getStatusClass(
                order.status
              )}`}
            >
              {formatStatus(order.status)}
            </span>
          </div>
        </section>

        {/* ====================================================
            TRACKING TIMELINE
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              {isPickup ? (
                <Store className="h-5 w-5 text-gray-700" />
              ) : (
                <Truck className="h-5 w-5 text-gray-700" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isPickup
                  ? "Pickup Progress"
                  : "Order Tracking"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Follow the progress of your order.
              </p>
            </div>
          </div>

          {order.status === "CANCELLED" ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <span className="font-bold text-red-600">
                    !
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-red-900">
                    This order has been cancelled.
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Please contact the store if you need more
                    information about this order.
                  </p>
                </div>
              </div>
            </div>
          ) : order.status === "PAYMENT_FAILED" ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <CreditCard className="h-4 w-4 text-red-600" />
                </div>

                <div>
                  <p className="font-semibold text-red-900">
                    Payment could not be verified.
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    Please review your payment information or
                    contact the store for assistance.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              {steps.map((step, index) => {
                const completed = index < currentStep;
                const active = index === currentStep;
                const isLast = index === steps.length - 1;

                const StepIcon = step.icon;

                return (
                  <div
                    key={step.key}
                    className="relative flex gap-4"
                  >
                    {/* CONNECTING LINE */}
                    {!isLast && (
                      <div
                        className={`absolute left-[19px] top-10 h-[calc(100%-10px)] w-0.5 ${
                          index < currentStep
                            ? "bg-gray-900"
                            : "bg-gray-200"
                        }`}
                      />
                    )}

                    {/* ICON */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        completed || active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="pb-8">
                      <p
                        className={`font-semibold ${
                          completed || active
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          completed || active
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        {step.description}
                      </p>

                      {active && (
                        <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Current status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            SHIPMENT
        ===================================================== */}

        {!isPickup && shipment && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Truck className="h-5 w-5 text-gray-700" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Shipment Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Details about your delivery.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Courier
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {shipment.courier || "Not assigned yet"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Tracking Number
                </p>

                <p className="mt-1 break-all font-mono font-semibold text-gray-900">
                  {shipment.tracking_number ||
                    "Not available yet"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Shipment Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                    shipment.status
                  )}`}
                >
                  {formatStatus(shipment.status)}
                </span>
              </div>

              {shipment.shipped_at && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Shipped At
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {formatDate(shipment.shipped_at)}
                  </p>
                </div>
              )}
            </div>

            {shipment.tracking_url && (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 sm:w-auto"
              >
                <Truck className="h-4 w-4" />
                Track Package
              </a>
            )}
          </section>
        )}

        {/* ====================================================
            PAYMENT
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Payment Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Payment details for this order.
              </p>
            </div>
          </div>

          {payment ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Method
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {payment.method}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Amount
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClass(
                    payment.status
                  )}`}
                >
                  {formatStatus(payment.status)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              No payment information available.
            </p>
          )}
        </section>

        {/* ====================================================
            DELIVERY / PICKUP
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              {isPickup ? (
                <Store className="h-5 w-5 text-gray-700" />
              ) : (
                <MapPin className="h-5 w-5 text-gray-700" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isPickup
                  ? "Pickup Information"
                  : "Delivery Information"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isPickup
                  ? "Information about your store pickup."
                  : "Where your order will be delivered."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Recipient
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {order.recipient_name}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-gray-700">
                {order.phone}
              </p>
            </div>

            {!isPickup && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Delivery Address
                </p>

                <div className="mt-2 rounded-xl bg-gray-50 p-4">
                  <p className="leading-6 text-gray-700">
                    {order.street_address}
                    {order.barangay &&
                      `, ${order.barangay}`}
                    {order.city && `, ${order.city}`}
                    {order.province &&
                      `, ${order.province}`}
                    {order.postal_code &&
                      ` ${order.postal_code}`}
                  </p>
                </div>
              </div>
            )}

            {isPickup && (
              <div className="sm:col-span-2">
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
                  <div className="flex items-start gap-3">
                    <Store className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />

                    <div>
                      <p className="font-semibold text-cyan-900">
                        Store Pickup
                      </p>

                      <p className="mt-1 text-sm leading-6 text-cyan-700">
                        Your order will be available for pickup
                        once the status reaches
                        <strong> Ready for Pickup</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            ORDER TOTAL
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Order Total
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {order.order_items.length}{" "}
                {order.order_items.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <div className="pb-8 pt-6 text-center">
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all orders
          </Link>
        </div>
      </div>
    </main>
  );
};

export default MyOrderDetails;