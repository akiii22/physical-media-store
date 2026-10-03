import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck2,
  FileImage,
  Loader2,
  Package,
  ShoppingBag,
  Upload,
} from "lucide-react";

import { useCart } from "../context/CartContext";

import {
  getOrderById,
  type OrderDetails,
} from "../services/orderServices";

import { uploadPaymentProof } from "../services/paymentService";

const OrderConfirmation = () => {
  const { orderId } = useParams<{
    orderId: string;
  }>();

  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderDetails | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  /*
   * ============================================================
   * GET ORDER DETAILS
   * ============================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError("");

        const orderData = await getOrderById(orderId);

        setOrder(orderData);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load order."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  /*
   * ============================================================
   * INVALID ORDER ID
   * ============================================================
   */

  if (!orderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl font-bold text-red-600">
              !
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Invalid Order
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            No order number was provided.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * FILE SELECTION
   * ============================================================
   */

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");
    setUploadSuccess(false);

    // Maximum 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be 5MB or less.");
      setFile(null);

      return;
    }

    setFile(selectedFile);
  };

  /*
   * ============================================================
   * COPY ORDER ID
   * ============================================================
   */

  const handleCopyOrderId = async () => {
    if (!order?.order_id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(order.order_id);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the order number.");
    }
  };

  /*
   * ============================================================
   * UPLOAD PAYMENT PROOF
   * ============================================================
   */

  const handleUpload = async () => {
    if (!orderId) {
      setError("Order ID is missing.");
      return;
    }

    if (!file) {
      setError("Please select a payment proof first.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      await uploadPaymentProof(orderId, file);

      /*
       * We don't modify the order object here.
       *
       * uploadSuccess controls the UI state instead.
       */
      setUploadSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload payment proof."
      );
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>

          <h1 className="mt-5 text-lg font-semibold text-gray-900">
            Loading your order...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we retrieve your order details.
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR / ORDER NOT FOUND
   * ============================================================
   */

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl font-bold text-red-600">
              !
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Unable to Load Order
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {error || "The order could not be found."}
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * DISPLAY VALUES
   * ============================================================
   */

  const orderStatus = order.status.replaceAll("_", " ");

  const paymentStatus =
    order.payment?.status || "PENDING";

  const paymentMethod =
    order.payment?.method || "N/A";

  const paymentAmount = Number(
    order.payment?.amount ?? order.total_amount
  );

  const hasPaymentProof =
    Boolean(order.payment?.proof_url) || uploadSuccess;
const deliveryFee = Number(order.delivery_fee ?? 0);
const hasDeliveryFee =
  deliveryFee > 0;
const amountToPayNow = Number(order.total_amount);

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-5xl">

        {/* =====================================================
            SUCCESS HEADER
        ====================================================== */}

        <section className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-11 w-11 text-green-600" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-green-600">
            Order Confirmed
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Thank you for your order!
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Your order has been successfully placed.
            Follow the payment instructions below to complete
            your purchase.
          </p>
        </section>

        {/* =====================================================
            ORDER OVERVIEW
        ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Order Number
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <p className="break-all font-mono text-sm font-semibold text-gray-900">
                    {order.order_id}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyOrderId}
                    className="shrink-0 rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    title="Copy order number"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {copied && (
                  <p className="mt-1 text-xs text-green-600">
                    Order number copied.
                  </p>
                )}
              </div>

              <span className="inline-flex w-fit rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-yellow-700">
                {orderStatus}
              </span>
            </div>
          </div>

          <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
  {/* Payment Method */}
  <div className="px-6 py-4 sm:px-6">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Payment Method
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      {paymentMethod}
    </p>
  </div>

  {/* Products */}
  <div className="px-6 py-4 sm:px-6">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Products
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      ₱{amountToPayNow.toLocaleString()}
    </p>
  </div>

  {/* Delivery */}
  <div className="px-6 py-4 sm:px-6">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Delivery Fee
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      {hasDeliveryFee
        ? `₱${deliveryFee.toLocaleString()}`
        : "To be determined"}
    </p>

    {!hasDeliveryFee && (
      <p className="mt-0.5 text-xs text-gray-500">
        Paid separately
      </p>
    )}
  </div>
</div>
        </section>

        {!hasDeliveryFee && (
  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
    <p className="text-sm font-medium text-yellow-800">
      Delivery fee will be paid separately
    </p>

    <p className="mt-0.5 text-xs leading-5 text-yellow-700">
      The store will calculate your delivery fee after reviewing
      your order. You can pay for the products now and pay the
      delivery fee separately once it is available.
    </p>
  </div>
)}

        {/* =====================================================
            WHAT HAPPENS NEXT
        ====================================================== */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Package className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                What happens next?
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Here's what you need to do to complete your order.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                1
              </span>

              <h3 className="mt-4 font-semibold text-gray-900">
                Complete Payment
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Send the exact order amount using your selected
                payment method.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                2
              </span>

              <h3 className="mt-4 font-semibold text-gray-900">
                Upload Receipt
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Upload your payment screenshot or receipt below.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                3
              </span>

              <h3 className="mt-4 font-semibold text-gray-900">
                Wait for Verification
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                The store will verify your payment before
                processing the order.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            PAYMENT INFORMATION
        ====================================================== */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Payment Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Complete your payment using the instructions below.
              </p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Method
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {paymentMethod}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Amount
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  ₱{paymentAmount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <p className="mt-1 font-semibold text-yellow-600">
                  {paymentStatus}
                </p>
              </div>
            </div>
          </div>

          {/* GCash */}
          {order.payment?.method === "GCASH" && (
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                Pay with GCash
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Send the exact amount shown above to the store's
                GCash account.
              </p>

              <div className="mt-4 rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  GCash Account
                </p>

                <p className="mt-2 text-lg font-bold text-gray-900">
                  [CLIENT GCASH NUMBER]
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  [CLIENT ACCOUNT NAME]
                </p>
              </div>
            </div>
          )}

          {/* Maya */}
          {order.payment?.method === "MAYA" && (
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                Pay with Maya
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Send the exact amount shown above to the store's
                Maya account.
              </p>

              <div className="mt-4 rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Maya Account
                </p>

                <p className="mt-2 text-lg font-bold text-gray-900">
                  [CLIENT MAYA NUMBER]
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  [CLIENT ACCOUNT NAME]
                </p>
              </div>
            </div>
          )}

          {/* Card */}
          {order.payment?.method === "CARD" && (
            <div className="mt-6 rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                Pay with Credit / Debit Card
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Complete your card payment using the store's
                payment provider.
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400"
              >
                Payment Provider Link
              </button>

              <p className="mt-2 text-xs text-gray-500">
                The payment provider link will be added once the
                store provides the required details.
              </p>
            </div>
          )}
        </section>

        {/* =====================================================
            PAYMENT PROOF
        ====================================================== */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <FileCheck2 className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Payment Proof
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload your receipt or payment screenshot after
                completing the payment.
              </p>
            </div>
          </div>

          {hasPaymentProof ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <div>
                  <p className="font-semibold text-green-800">
                    Payment proof submitted
                  </p>

                  <p className="mt-1 text-sm leading-5 text-green-700">
                    Your receipt has been submitted and is waiting
                    for verification by the store.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <label
                htmlFor="payment-proof"
                className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-gray-900 hover:bg-gray-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  {file ? (
                    <FileImage className="h-6 w-6 text-gray-700" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-700" />
                  )}
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {file
                    ? "Payment receipt selected"
                    : "Upload your payment receipt"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {file
                    ? "Click to choose a different file"
                    : "Click to browse your files"}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  JPG, PNG, or PDF · Maximum 5MB
                </p>

                <input
                  id="payment-proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                    <FileImage className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Payment Proof
                  </>
                )}
              </button>
            </>
          )}
        </section>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={`/my-orders/${order.order_id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700"
          >
            <Package className="h-4 w-4" />
            View My Order
          </Link>

          <Link
            to="/products"
            onClick={clearCart}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </section>

        <p className="mt-6 pb-4 text-center text-xs leading-5 text-gray-400">
          Keep your order number for future reference.
          You can view your order status anytime from My Orders.
        </p>
      </div>
    </main>
  );
};

export default OrderConfirmation;