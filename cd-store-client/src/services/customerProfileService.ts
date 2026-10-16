
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export type CustomerProfile = {
  id: string;
  email: string;
  role: "CUSTOMER";
  full_name: string | null;
  phone: string | null;
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

const requestProfile = async (
  method: "GET" | "PATCH",
  body?: { full_name: string; phone: string },
): Promise<CustomerProfile> => {
  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }

  const token = await getAccessToken();

  const response = await fetch(`${API_URL}/users/me/profile`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to process your profile.");
  }

  return data.data as CustomerProfile;
};

export const getMyProfile = (): Promise<CustomerProfile> =>
  requestProfile("GET");

export const updateMyProfile = (
  fullName: string,
  phone: string,
): Promise<CustomerProfile> =>
  requestProfile("PATCH", {
    full_name: fullName,
    phone,
  });
