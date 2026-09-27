import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:3000/api";

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

const MyOrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
         * We use /api/orders/my here and find the requested order.
         *
         * This is intentional for now because the endpoint already
         * guarantees that only the authenticated customer's orders
         * are returned.
         */
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
        console.error(
          "Failed to load order details:",
          err
        );

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

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="text-gray-500">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Unable to load order
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Order not found."}
            </p>

            <Link
              to="/my-orders"
              className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];

  const isPickup =
    order.delivery_method === "STORE_PICKUP";

  // =========================================================
  // STATUS STEPS
  // =========================================================

  const deliverySteps = [
    {
      key: "ORDER_PLACED",
      label: "Order Placed",
      description:
        "Your order has been successfully created.",
    },
    {
      key: "PAYMENT",
      label: "Payment Confirmed",
      description:
        "Your payment has been confirmed.",
    },
    {
      key: "PROCESSING",
      label: "Processing",
      description:
        "Your order is being prepared.",
    },
    {
      key: "READY_TO_SHIP",
      label: "Ready to Ship",
      description:
        "Your package is ready to be handed to the courier.",
    },
    {
      key: "SHIPPED",
      label: "Shipped",
      description:
        "Your package is on its way.",
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      description:
        "Your package has been delivered.",
    },
  ];

  const pickupSteps = [
    {
      key: "ORDER_PLACED",
      label: "Order Placed",
      description:
        "Your order has been successfully created.",
    },
    {
      key: "PAYMENT",
      label: "Payment Confirmed",
      description:
        "Your payment has been confirmed.",
    },
    {
      key: "PROCESSING",
      label: "Processing",
      description:
        "Your order is being prepared.",
    },
    {
      key: "READY_FOR_PICKUP",
      label: "Ready for Pickup",
      description:
        "Your order is ready to be picked up.",
    },
    {
      key: "PICKED_UP",
      label: "Picked Up",
      description:
        "Your order has been picked up.",
    },
  ];

  const steps = isPickup
    ? pickupSteps
    : deliverySteps;

  const getStepIndex = () => {
    if (isPickup) {
      switch (order.status) {
        case "PENDING_PAYMENT":
          return 0;

        case "PAID":
        case "PROCESSING":
          return order.status === "PAID" ? 1 : 2;

        case "READY_FOR_PICKUP":
          return 3;

        case "PICKED_UP":
          return 4;

        default:
          return order.status === "CANCELLED"
            ? -1
            : 0;
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

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          to="/my-orders"
          className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to My Orders
        </Link>

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Order Details
              </p>

              <h1 className="mt-1 font-mono text-xl font-bold text-gray-900">
                #{order.id.slice(0, 8)}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Placed {formatDate(order.created_at)}
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
        </div>

        {/* ===================================================
            TRACKING TIMELINE
        =================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            {isPickup
              ? "Pickup Progress"
              : "Order Tracking"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Follow the progress of your order.
          </p>

          {order.status === "CANCELLED" ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-900">
                This order has been cancelled.
              </p>
            </div>
          ) : (
            <div className="mt-8">

              {steps.map((step, index) => {
                const completed =
                  index < currentStep;

                const active =
                  index === currentStep;

                const isLast =
                  index === steps.length - 1;

                return (
                  <div
                    key={step.key}
                    className="relative flex gap-4"
                  >

                    {/* Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[15px] top-8 h-full w-0.5 ${
                          index < currentStep
                            ? "bg-gray-900"
                            : "bg-gray-200"
                        }`}
                      />
                    )}

                    {/* Circle */}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        completed || active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>

                    {/* Content */}
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
                        <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Current status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===================================================
            SHIPMENT
        =================================================== */}

        {!isPickup && shipment && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              Shipment Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Courier
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {shipment.courier ||
                    "Not assigned yet"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Tracking Number
                </p>

                <p className="mt-1 font-mono font-medium text-gray-900">
                  {shipment.tracking_number ||
                    "Not available yet"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Shipment Status
                </p>

                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                    shipment.status
                  )}`}
                >
                  {formatStatus(
                    shipment.status
                  )}
                </span>
              </div>

              {shipment.shipped_at && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Shipped At
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(
                      shipment.shipped_at
                    )}
                  </p>
                </div>
              )}
            </div>

            {shipment.tracking_url && (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 sm:w-auto"
              >
                Track Package →
              </a>
            )}
          </div>
        )}

        {/* ===================================================
            PAYMENT
        =================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            Payment Information
          </h2>

          {payment ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-3">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Method
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {payment.method}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Amount
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  ₱
                  {Number(
                    payment.amount
                  ).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Status
                </p>

                <p
                  className={`mt-1 font-medium ${
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
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              No payment information available.
            </p>
          )}
        </div>

        {/* ===================================================
            DELIVERY / PICKUP
        =================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            {isPickup
              ? "Pickup Information"
              : "Delivery Information"}
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Recipient
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {order.recipient_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-1 text-gray-700">
                {order.phone}
              </p>
            </div>

            {!isPickup && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Delivery Address
                </p>

                <p className="mt-1 text-gray-700">
                  {order.street_address}
                  {order.barangay &&
                    `, ${order.barangay}`}
                  {order.city &&
                    `, ${order.city}`}
                  {order.province &&
                    `, ${order.province}`}
                  {order.postal_code &&
                    ` ${order.postal_code}`}
                </p>
              </div>
            )}

            {isPickup && (
              <div className="sm:col-span-2">
                <div className="rounded-xl bg-cyan-50 p-4">
                  <p className="font-medium text-cyan-900">
                    Store Pickup
                  </p>

                  <p className="mt-1 text-sm text-cyan-700">
                    Your order will be available for
                    pickup once the status reaches
                    "Ready for Pickup".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            ORDER TOTAL
        =================================================== */}

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              Order Total
            </span>

            <span className="text-2xl font-bold text-gray-900">
              ₱
              {Number(
                order.total_amount
              ).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="pb-8 text-center">
          <Link
            to="/my-orders"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to all orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyOrderDetails;