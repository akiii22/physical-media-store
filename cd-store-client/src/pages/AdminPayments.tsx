import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import {
  getPendingPayments,
  verifyPayment,
  rejectPayment,
} from "../services/paymentService";

type PendingPayment = {
  payment_id: string;
  order_id: string;
  payment_method: "GCASH" | "MAYA" | "CARD";
  amount: number;
  payment_status: string;
  payment_type: "PRODUCT" | "DELIVERY";
  proof_url: string | null;
  created_at: string;

  order: {
    user_id: string;
    recipient_name: string;
    phone: string;
    total_amount: number;
    status: string;
    delivery_method: "DELIVERY" | "SAME_DAY" | "STORE_PICKUP";
    created_at: string;
  } | null;
};

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: payments = [],
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery<PendingPayment[], Error>({
    queryKey: ["admin-pending-payments"],
    queryFn: getPendingPayments,
  });

  useEffect(() => {
    if (isError) {
      toast.error(queryError?.message ?? "Failed to load pending payments.");
    }
  }, [isError, queryError]);

  const loadPayments = async () => {
    setError("");
    try {
      const result = await refetch();
      if (result.isError) {
        throw result.error ?? new Error("Failed to refresh pending payments.");
      }
      toast.success("Pending payments refreshed.");
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh pending payments.";
      setError(message);
      toast.error(message);
    }
  };

  const handleVerify = async (paymentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to verify this payment?"
    );
    if (!confirmed) return;

    try {
      setProcessingId(paymentId);
      setError("");

      await verifyPayment(paymentId);

      queryClient.setQueryData<PendingPayment[]>(
        ["admin-pending-payments"],
        (currentPayments = []) =>
          currentPayments.filter((payment) => payment.payment_id !== paymentId)
      );

      toast.success("Payment verified successfully.");
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : "Failed to verify payment.";
      setError(message);
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this payment?"
    );
    if (!confirmed) return;

    const reason = window.prompt(
      "Please provide a reason for rejecting this payment:"
    );
    if (reason === null) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      const message = "Please provide a rejection reason.";
      setError(message);
      toast.error(message);
      return;
    }

    if (trimmedReason.length > 1000) {
      const message = "The rejection reason must not exceed 1000 characters.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setProcessingId(paymentId);
      setError("");

      await rejectPayment(paymentId, trimmedReason);

      queryClient.setQueryData<PendingPayment[]>(
        ["admin-pending-payments"],
        (currentPayments = []) =>
          currentPayments.filter((payment) => payment.payment_id !== paymentId)
      );

      toast.success("Payment rejected.");
    } catch (rejectError) {
      const message =
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject payment.";
      setError(message);
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  // LOADING
  

  if (isLoading) {

    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <p className="text-lg font-medium text-gray-900">
              Loading payments...
            </p>

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">

      <div className="mx-auto max-w-6xl">


        
        {/* HEADER */}
        

        <div className="mb-8">

          <p className="text-sm font-medium text-gray-500">
            Admin Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Payment Verification
          </h1>

          <p className="mt-2 text-gray-600">
            Review customer payment proofs and verify
            completed payments.
          </p>

        </div>


        
        {/* ERROR */}
       

        {error && (

          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        )}


        {/* EMPTY STATE */}
        

        {payments.length === 0 && (

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm">
  <CheckCircle2
    size={32}
    strokeWidth={1.8}
    className="text-emerald-600"
    aria-hidden="true"
  />
</div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No Pending Payments
            </h2>

            <p className="mt-2 text-gray-500">
              There are currently no payment proofs waiting
              for verification.
            </p>

            <button
              type="button"
              onClick={loadPayments}
              className="mt-6 rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
            >
              Refresh
            </button>

          </div>

        )}


        
        {/* PAYMENT LIST */}
       

        <div className="space-y-6">

          {payments.map((payment) => (

            <div
              key={payment.payment_id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >

         
              {/* Card Header */}
            

<div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Order Number
    </p>

    <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-900">
      {payment.order_id}
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-2">
    <span
      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
        payment.payment_type === "DELIVERY"
          ? "bg-blue-100 text-blue-700"
          : "bg-purple-100 text-purple-700"
      }`}
    >
      {payment.payment_type === "DELIVERY"
        ? "Delivery Payment"
        : "Product Payment"}
    </span>

    <span className="w-fit rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
      {payment.payment_status}
    </span>
  </div>
</div>


              <div className="grid gap-6 p-6 lg:grid-cols-2">


               
                {/* ORDER INFORMATION */}
              
                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    Order Information
                  </h2>


                  <div className="mt-4 space-y-4">

                    <div>

                      <p className="text-xs text-gray-500">
                        Customer
                      </p>

                    <p className="font-medium text-gray-900">
  {payment.order?.delivery_method === "STORE_PICKUP"
    ? "Pasay Store Pickup"
    : payment.order?.delivery_method === "SAME_DAY"
      ? "Same-Day Lalamove"
      : "Nationwide Delivery"}
</p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Phone
                      </p>

                      <p className="font-medium text-gray-900">
                        {payment.order?.phone ||
                          "No phone number"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Delivery Method
                      </p>

                      <p className="font-medium text-gray-900">
                        {payment.order?.delivery_method ===
                        "STORE_PICKUP"
                          ? "Pasay Store Pickup"
                          : "Nationwide Delivery"}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Order Total
                      </p>

                      <p className="text-xl font-bold text-gray-900">
                        ₱
                        {Number(
                          payment.amount
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                </div>


                {/* ================================================== */}
                {/* PAYMENT INFORMATION */}
                {/* ================================================== */}

                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    Payment Information
                  </h2>


                  <div className="mt-4 space-y-4">

                    <div>

                      <p className="text-xs text-gray-500">
                        Payment Method
                      </p>

                      <p className="font-medium text-gray-900">
                        {payment.payment_method}
                      </p>

                    </div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Payment Amount
                      </p>

                      <p className="text-xl font-bold text-gray-900">
                        ₱
                        {Number(
                          payment.amount
                        ).toLocaleString()}
                      </p>

                    </div>

                    <div>
  <p className="text-xs text-gray-500">
    Payment Type
  </p>

  <p className="font-medium text-gray-900">
    {payment.payment_type === "DELIVERY"
      ? "Delivery Fee"
      : "Product Order"}
  </p>
</div>


                    <div>

                      <p className="text-xs text-gray-500">
                        Submitted
                      </p>

                      <p className="font-medium text-gray-900">
                        {new Date(
                          payment.created_at
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                </div>

              </div>


              {/* ================================================== */}
              {/* PAYMENT PROOF */}
              {/* ================================================== */}

              {payment.proof_url && (

                <div className="border-t border-gray-200 p-6">

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h2 className="text-lg font-bold text-gray-900">
      Payment Proof
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Review the customer's submitted proof before verifying the payment.
    </p>
  </div>
</div>


                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

                    <img
                      src={payment.proof_url}
                      alt="Payment proof"
                      className="max-h-[500px] w-full object-contain"
                    />

                  </div>

                </div>

              )}


              {/* ================================================== */}
              {/* ACTIONS */}
              {/* ================================================== */}

              <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    handleReject(
                      payment.payment_id
                    )
                  }
                  disabled={
                    processingId ===
                    payment.payment_id
                  }
                  className="rounded-lg border border-red-300 px-5 py-3 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {processingId ===
                  payment.payment_id
                    ? "Processing..."
                    : "Reject Payment"}

                </button>


                <button
                  type="button"
                  onClick={() =>
                    handleVerify(
                      payment.payment_id
                    )
                  }
                  disabled={
                    processingId ===
                    payment.payment_id
                  }
                  className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {processingId ===
                  payment.payment_id
                    ? "Processing..."
                    : "Verify Payment"}

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
};

export default AdminPayments;