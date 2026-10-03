import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
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

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  payment_type: "PRODUCT" | "DELIVERY";
  proof_url: string | null;
  paid_at: string | null;
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_fee_status: string;
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

  payments: Payment[];

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

  // Delivery payment
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<
    "GCASH" | "MAYA" | "CARD"
  >("GCASH");

  // IMPORTANT:
  // This is the selected image/file, NOT the database payment.
  const [deliveryProofFile, setDeliveryProofFile] =
    useState<File | null>(null);

  const [isCreatingDeliveryPayment, setIsCreatingDeliveryPayment] =
    useState(false);

  const [isUploadingDeliveryProof, setIsUploadingDeliveryProof] =
    useState(false);

  const [deliveryPaymentMessage, setDeliveryPaymentMessage] =
    useState("");

    const [productProofFile, setProductProofFile] =
  useState<File | null>(null);

const [isUploadingProductProof, setIsUploadingProductProof] =
  useState(false);

const [productPaymentMessage, setProductPaymentMessage] =
  useState("");



  /*
   * ============================================================
   * LOAD ORDER
   * ============================================================
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
   * CREATE DELIVERY PAYMENT
   * ============================================================
   */

  const handleCreateDeliveryPayment = async () => {
    if (!order) return;

    try {
      setIsCreatingDeliveryPayment(true);
      setDeliveryPaymentMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/payments/delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            order_id: order.id,
            method: deliveryPaymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create delivery payment."
        );
      }

      /*
       * Reload the order so the newly-created DELIVERY
       * payment appears in order.payments.
       */
      window.location.reload();
    } catch (err) {
      setDeliveryPaymentMessage(
        err instanceof Error
          ? err.message
          : "Failed to create delivery payment."
      );
    } finally {
      setIsCreatingDeliveryPayment(false);
    }
  };

  /*
   * ============================================================
   * UPLOAD DELIVERY PAYMENT PROOF
   * ============================================================
   */

  const handleUploadDeliveryProof = async () => {
    if (!order || !deliveryProofFile) {
      return;
    }

    try {
      setIsUploadingDeliveryProof(true);
      setDeliveryPaymentMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const formData = new FormData();

      formData.append("proof", deliveryProofFile);

      const response = await fetch(
        `${API_URL}/payments/delivery/${order.id}/proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to upload delivery payment proof."
        );
      }

      setDeliveryProofFile(null);

      /*
       * Reload so the updated DELIVERY payment
       * appears immediately.
       */
      window.location.reload();
    } catch (err) {
      setDeliveryPaymentMessage(
        err instanceof Error
          ? err.message
          : "Failed to upload delivery payment proof."
      );
    } finally {
      setIsUploadingDeliveryProof(false);
    }
  };

  const handleUploadProductProof = async () => {
  if (!order || !productProofFile) {
    return;
  }

  try {
    setIsUploadingProductProof(true);
    setProductPaymentMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    const formData = new FormData();

    formData.append("proof", productProofFile);

    const response = await fetch(
      `${API_URL}/payments/${order.id}/proof`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to upload payment proof."
      );
    }

    setProductProofFile(null);

    setProductPaymentMessage(
      "Payment proof uploaded successfully."
    );

    window.location.reload();
  } catch (err) {
    setProductPaymentMessage(
      err instanceof Error
        ? err.message
        : "Failed to upload payment proof."
    );
  } finally {
    setIsUploadingProductProof(false);
  }
};

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

  const productPayment = order.payments?.find(
    (payment) => payment.payment_type === "PRODUCT"
  );

  const deliveryPaymentRecord = order.payments?.find(
    (payment) => payment.payment_type === "DELIVERY"
  );

  console.log("ORDER PAYMENTS:", order.payments);
console.log("PRODUCT PAYMENT:", productPayment);


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
        "Your product payment has been confirmed.",
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
        "Your product payment has been confirmed.",
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

        {/* HEADER */}

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

        {/* TIMELINE */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-gray-900">
            Order Progress
          </h2>

          <div className="mt-6 space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const completed = index <= currentStep;

              return (
                <div
                  key={step.key}
                  className="flex gap-4"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      completed
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p
                      className={`font-semibold ${
                        completed
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ORDER SUMMARY */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-gray-900">
            Order Summary
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {order.order_items.length}{" "}
            {order.order_items.length === 1
              ? "item"
              : "items"}
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                Products Total
              </span>

              <span className="font-medium text-gray-900">
                {formatCurrency(order.total_amount)}
              </span>
            </div>

            {!isPickup && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Delivery Fee
                  </p>

                  {order.delivery_fee_status === "PENDING" && (
                    <p className="mt-1 text-xs text-yellow-600">
                      Payment pending
                    </p>
                  )}

                  {order.delivery_fee_status === "PAID" && (
                    <p className="mt-1 text-xs text-green-600">
                      Payment confirmed
                    </p>
                  )}
                </div>

                <span className="font-medium text-gray-900">
                  {formatCurrency(order.delivery_fee)}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-semibold text-gray-900">
                  Total Order Cost
                </span>

                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    order.total_amount +
                      (isPickup ? 0 : order.delivery_fee)
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SHIPMENT */}

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

        {/* PAYMENT */}

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

          <div className="mt-6 space-y-4">

            {/* PRODUCT PAYMENT */}

            {productPayment && (
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Product Payment
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {productPayment.method}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(productPayment.amount)}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClass(
                        productPayment.status
                      )}`}
                    >
                      {formatStatus(productPayment.status)}
                    </span>
                  </div>
                </div>

               {productPayment.status !== "PAID" &&
  !productPayment.proof_url && (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">
        Upload Product Payment Proof
      </label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          setProductProofFile(
            event.target.files?.[0] ?? null
          );
        }}
        className="mt-2 block w-full text-sm text-gray-600"
      />

      {productProofFile && (
        <p className="mt-2 text-xs text-gray-500">
          Selected: {productProofFile.name}
        </p>
      )}

      <button
        type="button"
        onClick={handleUploadProductProof}
        disabled={
          !productProofFile ||
          isUploadingProductProof
        }
        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploadingProductProof
          ? "Uploading..."
          : "Upload Payment Proof"}
      </button>
    </div>
  )}

  {productPaymentMessage && (
  <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
    {productPaymentMessage}
  </p>
)}
              </div>
            )}

            {/* DELIVERY PAYMENT */}

            {!isPickup && order.delivery_fee > 0 && (
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Delivery Payment
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Delivery fee
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.delivery_fee)}
                    </p>
                  </div>
                </div>

                

                {/* DELIVERY PAYMENT EXISTS */}

                {deliveryPaymentRecord && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Payment Method
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {deliveryPaymentRecord.method}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getPaymentClass(
                          deliveryPaymentRecord.status
                        )}`}
                      >
                        {formatStatus(
                          deliveryPaymentRecord.status
                        )}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-900">
                      Amount:{" "}
                      {formatCurrency(
                        deliveryPaymentRecord.amount
                      )}
                    </p>

                   

                    {/* UPLOAD DELIVERY PROOF */}

                    {deliveryPaymentRecord.status !== "PAID" &&
                      !deliveryPaymentRecord.proof_url && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Upload Delivery Payment Proof
                          </label>

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                              setDeliveryProofFile(
                                event.target.files?.[0] ?? null
                              );
                            }}
                            className="mt-2 block w-full text-sm text-gray-600"
                          />

                          {deliveryProofFile && (
                            <p className="mt-2 text-xs text-gray-500">
                              Selected:{" "}
                              {deliveryProofFile.name}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={handleUploadDeliveryProof}
                            disabled={
                              !deliveryProofFile ||
                              isUploadingDeliveryProof
                            }
                            className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUploadingDeliveryProof
                              ? "Uploading..."
                              : "Upload Delivery Proof"}
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* DELIVERY PAYMENT DOES NOT EXIST */}

                {!deliveryPaymentRecord &&
                  order.delivery_fee_status !== "PAID" && (
                    <div className="mt-4 rounded-xl bg-yellow-50 p-4">
                      <p className="text-sm font-medium text-yellow-900">
                        Delivery fee payment is required.
                      </p>

                      <p className="mt-1 text-xs leading-5 text-yellow-700">
                        Select your payment method to create
                        the delivery payment.
                      </p>

                      <select
                        value={deliveryPaymentMethod}
                        onChange={(event) => {
                          setDeliveryPaymentMethod(
                            event.target.value as
                              | "GCASH"
                              | "MAYA"
                              | "CARD"
                          );
                        }}
                        className="mt-3 w-full rounded-lg border border-yellow-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                      >
                        <option value="GCASH">
                          GCash
                        </option>

                        <option value="MAYA">
                          Maya
                        </option>

                        <option value="CARD">
                          Card
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={handleCreateDeliveryPayment}
                        disabled={isCreatingDeliveryPayment}
                        className="mt-3 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingDeliveryPayment
                          ? "Preparing Payment..."
                          : "Continue to Delivery Payment"}
                      </button>
                    </div>
                  )}

                {deliveryPaymentMessage && (
                  <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-red-600">
                    {deliveryPaymentMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* DELIVERY / PICKUP */}

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

        {/* ORDER TOTAL */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Total Order Cost
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {order.order_items.length}{" "}
                {order.order_items.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                order.total_amount +
                  (isPickup ? 0 : order.delivery_fee)
              )}
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