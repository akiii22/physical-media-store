import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

// Get the current user's access token
const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  return session.access_token;
};

// Upload payment proof
export const uploadPaymentProof = async (
  orderId: string,
  file: File
) => {
  const token = await getAccessToken();

  const formData = new FormData();
  formData.append("proof", file);

  const response = await fetch(
    `${API_URL}/payments/${orderId}/proof`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to upload payment proof."
    );
  }

  return data;
};

// Get pending payments
export const getPendingPayments = async () => {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_URL}/payments/pending`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve pending payments."
    );
  }

  return data.data;
};

// Verify payment
export const verifyPayment = async (
  paymentId: string
) => {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_URL}/payments/${paymentId}/verify`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to verify payment."
    );
  }

  return data;
};

// Reject payment
export const rejectPayment = async (
  paymentId: string
) => {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_URL}/payments/${paymentId}/reject`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to reject payment."
    );
  }

  return data;
};