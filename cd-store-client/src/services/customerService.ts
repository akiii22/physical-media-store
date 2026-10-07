import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  status: "Active" | "New";
  joined: string | null;
};

const getAccessToken = async (): Promise<string> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("You must be logged in.");
  }

  return session.access_token;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const token = await getAccessToken();

  const response = await fetch(`${API_URL}/users/admin/customers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch customers.");
  }

  return data.data;
};