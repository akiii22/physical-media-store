export type OrderItemInput = {
  product_id: string;
  quantity: number;
};

export type CreateOrderInput = {
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
  items: OrderItemInput[];
};