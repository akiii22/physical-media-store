import type { CartItem } from "../types/cart";
import { supabase } from "../lib/supabase";

const API_URL = "http://localhost:3000/api";

type CreateOrderData = {
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in to place an order.");
  }

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      customer_name: orderData.customer_name,
      phone: orderData.phone,
      province: orderData.province,
      city: orderData.city,
      barangay: orderData.barangay,
      street_address: orderData.street_address,
      postal_code: orderData.postal_code,
      delivery_method: orderData.delivery_method,
      payment_method: orderData.payment_method,

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in to view this order.");
  }

  const response = await fetch(
    `${API_URL}/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve order."
    );
  }

  return data.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin session not found.");
  }

  const response = await fetch(
    `${API_URL}/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update order status."
    );
  }

  return data;
};

export type ShipmentStatus =
  | "PENDING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED";

type UpdateShipmentData = {
  courier: string;
  tracking_number: string;
  tracking_url: string;
  status: ShipmentStatus;
};

export const updateShipment = async (
  orderId: string,
  shipmentData: UpdateShipmentData
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin session not found.");
  }

  const response = await fetch(
    `${API_URL}/orders/${orderId}/shipment`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(shipmentData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update shipment."
    );
  }

  return data;
};