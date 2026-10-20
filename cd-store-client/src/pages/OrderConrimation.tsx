
import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck2,
  FileImage,
  Loader2,
  Mail,
  Package,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCart } from "../context/CartContext";
import { getOrderById } from "../services/orderServices";
import { uploadPaymentProof } from "../services/paymentService";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { clearCart } = useCart();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState("");

  const {
    data: order,
    isPending: isLoading,
    error: orderError,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Order ID is missing.");
      return getOrderById(orderId);
    },
    enabled: Boolean(orderId),
    retry: 1,
  });

  const uploadMutation = useMutation({
    mutationKey: ["upload-payment-proof", orderId],

    mutationFn: ({ selectedFile }: { selectedFile: File }) => {
      if (!orderId) throw new Error("Order ID is missing.");
      return uploadPaymentProof(orderId, selectedFile);
    },

    onSuccess: async () => {
      setUploadSuccess(true);
      setFile(null);
      setValidationError("");

      toast.success("Payment proof submitted", {
        description:
          "Your receipt is awaiting admin verification. Check your email for updates.",
      });

      await queryClient.invalidateQueries({
        queryKey: ["order", orderId],
      });
    },

    onError: (error) => {
      toast.error("Payment proof upload failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0];

    if (!selectedFile) return;

    setValidationError("");
    setUploadSuccess(false);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      input.value = "";
      toast.error("Unsupported file type", {
        description: "Choose a JPG, PNG, or PDF file.",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      input.value = "";
      toast.error("File is too large", {
        description: "Your payment proof must be 5 MB or less.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) {
      setValidationError("Please select a payment proof first.");
      toast.error("Select a payment proof before uploading.");
      return;
    }

    uploadMutation.mutate({ selectedFile: file });
  };

  const handleCopyOrderId = async () => {
    if (!order?.order_id) return;

    try {
      await navigator.clipboard.writeText(order.order_id);
      setCopied(true);
      toast.success("Order number copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy the order number.");
    }
  };

  if (!orderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Invalid Order
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            No order number was provided.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-800" />
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

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Unable to Load Order
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {orderError instanceof Error
              ? orderError.message
              : "The order could not be found."}
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const paymentStatus = order.payment?.status || "PENDING";
  const paymentMethod = order.payment?.method || "N/A";
  const paymentAmount = Number(
    order.payment?.amount ?? order.total_amount
  );
  const deliveryFee = Number(order.delivery_fee ?? 0);
  const hasDeliveryFee = deliveryFee > 0;
  const hasPaymentProof =
    Boolean(order.payment?.proof_url) || uploadSuccess;
  const isUploading = uploadMutation.isPending;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-11 w-11 text-green-600" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-green-600">
            Order Placed
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Thank you for your order!
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Your order has been placed successfully. Check your registered
            email for payment instructions and future updates.
          </p>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
                  title="Copy order number"
                  aria-label="Copy order number"
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <span className="w-fit rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold uppercase text-yellow-700">
              {order.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Payment Method
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {paymentMethod}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Order Total
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatCurrency(Number(order.total_amount))}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Delivery Fee
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {hasDeliveryFee
                  ? formatCurrency(deliveryFee)
                  : "To be determined"}
              </p>
              {!hasDeliveryFee && (
                <p className="mt-1 text-xs text-gray-500">
                  The store will confirm this separately.
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
            <p className="mt-1 text-xs leading-5 text-yellow-700">
              The store will calculate the delivery fee after reviewing your
              order. Follow the store's instructions before paying this
              separate fee.
            </p>
          </div>
        )}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <Package className="h-6 w-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                What happens next?
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Follow these steps to complete your order.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Check Your Email", "Review the payment instructions sent to your registered email address."],
              ["2", "Complete Payment", "Follow the instructions and pay the amount requested for your order."],
              ["3", "Upload Receipt", "Upload your payment screenshot or receipt below for admin verification."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-xl bg-gray-50 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {number}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <CreditCard className="h-6 w-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Payment Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Check your email for payment instructions and updates.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Method</p>
                <p className="mt-1 font-semibold text-gray-900">{paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Payment Amount</p>
                <p className="mt-1 font-semibold text-gray-900">{formatCurrency(paymentAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Payment Status</p>
                <p className="mt-1 font-semibold text-yellow-700">
                  {paymentStatus.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Check your email for payment instructions
                </h3>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  After completing payment, upload your receipt below. We'll
                  notify you by email after the admin reviews your payment proof.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex items-start gap-4">
            <FileCheck2 className="h-6 w-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Payment Proof</h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload your receipt or payment screenshot after completing payment.
              </p>
            </div>
          </div>

          {hasPaymentProof ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Payment proof submitted
                    </p>
                    <p className="mt-1 text-sm leading-5 text-green-700">
                      Your receipt has been submitted and is awaiting admin verification.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Please check your email
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      We'll notify you when the admin approves or rejects your
                      payment proof. If rejected, check the email for the reason
                      and next steps. Submitting a receipt does not mean your
                      payment has been approved.
                    </p>
                  </div>
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
                  {file ? "Payment receipt selected" : "Upload your payment receipt"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {file ? "Click to choose a different file" : "Click to browse your files"}
                </p>
                <p className="mt-3 text-xs text-gray-400">
                  JPG, PNG, or PDF · Maximum 5 MB
                </p>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <FileImage className="h-5 w-5 shrink-0 text-gray-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">{validationError}</p>
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
      </div>
    </main>
  );
};

export default OrderConfirmation;
