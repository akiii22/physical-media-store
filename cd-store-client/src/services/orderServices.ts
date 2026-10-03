import type { CartItem } from "../types/cart";
import { supabase } from "../lib/supabase";


   //API CONFIG


const API_URL = import.meta.env.VITE_API_URL;


   //TYPES


export type DeliveryMethod =
  | "DELIVERY"
  | "SAME_DAY"
  | "STORE_PICKUP";

export type PaymentMethod =
  | "GCASH"
  | "MAYA"
  | "CARD";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_FAILED"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "CANCELLED";

export type ShipmentStatus =
  | "PENDING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED";


   //CREATE ORDER


export type CreateOrderData = {
  customer_name: string;
  phone: string;

  province?: string;
  city?: string;
  barangay?: string;
  street_address?: string;
  postal_code?: string;

  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;

  items: CartItem[];
};

export type CreateOrderResponse = {
  message: string;

  data: {
    order_id: string;
    total_amount: number;
    status: OrderStatus;
  };
};


   //ORDER DETAILS


export type OrderPayment = {
  method: PaymentMethod;
  amount: number;
  status: string;
  proof_url: string | null;
  paid_at: string | null;
};

export type OrderShipment = {
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
};

export type OrderDetails = {
  order_id: string;
  status: OrderStatus;
  total_amount: number;

  delivery_method: DeliveryMethod;

  recipient_name: string;
  phone: string;

  province: string | null;
  city: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;

  created_at: string;

  payment: OrderPayment | null;

  shipment: OrderShipment | null;
};


   // SHIPMENT


export type UpdateShipmentData = {
  courier: string;
  tracking_number: string;
  tracking_url: string;
  status: ShipmentStatus;
};


   //AUTH HELPER


const getAccessToken = async (): Promise<string> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      "Unable to retrieve your authentication session."
    );
  }

  if (!session?.access_token) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  return session.access_token;
};


   //REQUEST HELPER


const authenticatedRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getAccessToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }
  );

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong with the request.";

    throw new Error(message);
  }

  return data as T;
};


   //CREATE ORDER


export const createOrder = async (
  orderData: CreateOrderData
): Promise<CreateOrderResponse> => {
  const payload = {
    customer_name: orderData.customer_name.trim(),
    phone: orderData.phone.trim(),

    province: orderData.province?.trim(),
    city: orderData.city?.trim(),
    barangay: orderData.barangay?.trim(),
    street_address: orderData.street_address?.trim(),
    postal_code: orderData.postal_code?.trim(),

    delivery_method: orderData.delivery_method,
    payment_method: orderData.payment_method,

    items: orderData.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
  };

  return authenticatedRequest<CreateOrderResponse>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};


   //GET ORDER BY ID


export const getOrderById = async (
  orderId: string
): Promise<OrderDetails> => {
  if (!orderId.trim()) {
    throw new Error("Order ID is required.");
  }

  const response =
    await authenticatedRequest<{
      message: string;
      data: OrderDetails;
    }>(
      `/orders/${encodeURIComponent(orderId)}`
    );

  return response.data;
};


   //UPDATE ORDER STATUS


export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  if (!orderId.trim()) {
    throw new Error("Order ID is required.");
  }

  return authenticatedRequest(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",

      body: JSON.stringify({
        status,
      }),
    }
  );
};


   //UPDATE SHIPMENT

export const updateShipment = async (
  orderId: string,
  shipmentData: UpdateShipmentData
) => {
  if (!orderId.trim()) {
    throw new Error("Order ID is required.");
  }

  return authenticatedRequest(
    `/orders/${encodeURIComponent(orderId)}/shipment`,
    {
      method: "PATCH",

      body: JSON.stringify(shipmentData),
    }
  );
};