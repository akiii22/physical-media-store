import type { CartItem } from "../types/cart";

const API_URL = "http://localhost:3000/api";

type CreateOrderData = {
  user_id: string;
  customer_name: string;
  phone: string;
  province?: string;
  city?: string;
  barangay?: string;
  street_address?: string;
  postal_code?: string;
  delivery_method: "DELIVERY" | "STORE_PICKUP";
  payment_method: "GCASH" | "MAYA" | "CARD";
  items: CartItem[];
};

type CreateOrderResponse = {
  message: string;
  data: {
    order_id: string;
    total_amount: number;
    status: string;
  };
};

export const createOrder = async (
  orderData: CreateOrderData
): Promise<CreateOrderResponse> => {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...orderData,

      // Only send the information the backend needs
      items: orderData.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(
      errorData.message || "Failed to create order"
    );
  }

  return response.json();
};

export type OrderDetails = {
  order_id: string;
  status: string;
  total_amount: number;
  delivery_method: "DELIVERY" | "STORE_PICKUP";
  recipient_name: string;
  phone: string;
  province: string | null;
  city: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;
  created_at: string;

  payment: {
    method: "GCASH" | "MAYA" | "CARD";
    amount: number;
    status: string;
    proof_url: string | null;
    paid_at: string | null;
  };
};

export const getOrderById = async (
  orderId: string
): Promise<OrderDetails> => {
  const response = await fetch(
    `${API_URL}/orders/${orderId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve order."
    );
  }

  return data.data;
};