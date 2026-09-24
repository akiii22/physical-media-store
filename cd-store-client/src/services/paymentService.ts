const API_URL = "http://localhost:3000/api";

export const uploadPaymentProof = async (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append("proof", file);

    const response = await fetch(`${API_URL}/payments/${orderId}/proof`, {
        method: "POST",
        body: formData
    })

    const data = await response.json();

    if(!response.ok) {
        throw new Error(data.message || "Failed to upload payment proof.")
    }

    return data;
}

export const getPendingPayments = async () => {
  const response = await fetch(
    `${API_URL}/payments/pending`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve pending payments."
    );
  }

  return data.data;
};


export const verifyPayment = async (
  paymentId: string
) => {
  const response = await fetch(
    `${API_URL}/payments/${paymentId}/verify`,
    {
      method: "PATCH",
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


export const rejectPayment = async (
  paymentId: string
) => {
  const response = await fetch(
    `${API_URL}/payments/${paymentId}/reject`,
    {
      method: "PATCH",
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