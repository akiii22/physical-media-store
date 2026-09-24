import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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


  // ============================================================
  // GET ORDER DETAILS
  // ============================================================

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setIsLoading(false);
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


  // ============================================================
  // FILE SELECTION
  // ============================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError("");
    setUploadSuccess(false);

    // Maximum 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be 5MB or less.");
      return;
    }

    setFile(selectedFile);
  };


  // ============================================================
  // UPLOAD PAYMENT PROOF
  // ============================================================

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

      setUploadSuccess(true);

      // Update local payment status
      if (order) {
        setOrder({
          ...order,

          payment: {
            ...order.payment,
            proof_url: "uploaded",
          },
        });
      }

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


  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Loading your order...
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Please wait.
          </p>
        </div>
      </main>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Unable to Load Order
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "The order could not be found."}
          </p>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
          >
            Back to Products
          </Link>

        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">

      <div className="mx-auto w-full max-w-xl">


        {/* ================================================== */}
        {/* ORDER SUCCESS */}
        {/* ================================================== */}

        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Order Placed Successfully!
          </h1>

          <p className="mt-3 text-gray-600">
            Thank you for your order.
          </p>


          {/* Order Number */}

          <div className="mt-6 rounded-xl bg-gray-100 p-5">

            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
              {order.order_id}
            </p>

          </div>


          {/* Total */}

          <div className="mt-4 rounded-xl bg-gray-100 p-5">

            <p className="text-sm text-gray-500">
              Order Total
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              ₱{Number(order.total_amount).toLocaleString()}
            </p>

          </div>


          {/* Order Status */}

          <div className="mt-4">

            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
              {order.status.replaceAll("_", " ")}
            </span>

          </div>

        </div>


        {/* ================================================== */}
        {/* PAYMENT INFORMATION */}
        {/* ================================================== */}

        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Payment Information
          </h2>


          <div className="mt-5 rounded-xl bg-gray-100 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-gray-500">
                Payment Method
              </span>

              <span className="font-semibold text-gray-900">
                {order.payment.method}
              </span>

            </div>


            <div className="mt-4 flex items-center justify-between">

              <span className="text-sm text-gray-500">
                Amount
              </span>

              <span className="font-semibold text-gray-900">
                ₱{Number(order.payment.amount).toLocaleString()}
              </span>

            </div>


            <div className="mt-4 flex items-center justify-between">

              <span className="text-sm text-gray-500">
                Payment Status
              </span>

              <span className="font-semibold text-yellow-600">
                {order.payment.status}
              </span>

            </div>

          </div>


          {/* ================================================== */}
          {/* GCASH */}
          {/* ================================================== */}

          {order.payment.method === "GCASH" && (

            <div className="mt-6 rounded-xl border border-gray-200 p-5">

              <h3 className="text-lg font-semibold text-gray-900">
                Pay with GCash
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Send the exact amount to the store's GCash
                account.
              </p>


              <div className="mt-4 rounded-lg bg-gray-100 p-4">

                <p className="text-xs text-gray-500">
                  GCash Account
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  [CLIENT GCASH NUMBER]
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  [CLIENT ACCOUNT NAME]
                </p>

              </div>

            </div>

          )}


          {/* ================================================== */}
          {/* MAYA */}
          {/* ================================================== */}

          {order.payment.method === "MAYA" && (

            <div className="mt-6 rounded-xl border border-gray-200 p-5">

              <h3 className="text-lg font-semibold text-gray-900">
                Pay with Maya
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Send the exact amount to the store's Maya
                account.
              </p>


              <div className="mt-4 rounded-lg bg-gray-100 p-4">

                <p className="text-xs text-gray-500">
                  Maya Account
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  [CLIENT MAYA NUMBER]
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  [CLIENT ACCOUNT NAME]
                </p>

              </div>

            </div>

          )}


          {/* ================================================== */}
          {/* CARD */}
          {/* ================================================== */}

          {order.payment.method === "CARD" && (

            <div className="mt-6 rounded-xl border border-gray-200 p-5">

              <h3 className="text-lg font-semibold text-gray-900">
                Pay with Credit / Debit Card
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Complete your card payment using the
                store's payment provider.
              </p>


              <button
                type="button"
                disabled
                className="mt-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
              >
                Payment Provider Link
              </button>


              <p className="mt-2 text-xs text-gray-500">
                The payment provider link will be added once
                the store provides the required details.
              </p>

            </div>

          )}

        </div>


        {/* ================================================== */}
        {/* PAYMENT PROOF */}
        {/* ================================================== */}

        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Upload Payment Proof
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            After completing your payment, upload your
            receipt or payment screenshot.
          </p>


          {/* File Input */}

          <div className="mt-5">

            <label
              htmlFor="payment-proof"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Receipt
            </label>


            <input
              id="payment-proof"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploadSuccess}
              className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
            />


            <p className="mt-2 text-xs text-gray-500">
              Maximum file size: 5MB
            </p>

          </div>


          {/* Selected File */}

          {file && (

            <div className="mt-4 rounded-lg bg-gray-100 p-4">

              <p className="text-sm font-medium text-gray-900">
                Selected file
              </p>

              <p className="mt-1 break-all text-sm text-gray-600">
                {file.name}
              </p>

            </div>

          )}


          {/* Error */}

          {error && (

            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>

          )}


          {/* Success */}

          {uploadSuccess && (

            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">

              Payment proof uploaded successfully.

              <p className="mt-1 text-xs text-green-600">
                Your payment is now waiting for verification
                by the store.
              </p>

            </div>

          )}


          {/* Upload Button */}

          <button
            type="button"
            onClick={handleUpload}
            disabled={
              !file ||
              isUploading ||
              uploadSuccess
            }
            className="mt-5 w-full rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >

            {isUploading
              ? "Uploading..."
              : uploadSuccess
              ? "Payment Proof Submitted"
              : "Upload Payment Proof"}

          </button>

        </div>


        {/* ================================================== */}
        {/* CONTINUE SHOPPING */}
        {/* ================================================== */}

        <div className="mt-6 text-center">

          <Link
            to="/products"
            onClick={clearCart}
            className="inline-block rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
          >
            Continue Shopping
          </Link>

        </div>

      </div>

    </main>
  );
};

export default OrderConfirmation;