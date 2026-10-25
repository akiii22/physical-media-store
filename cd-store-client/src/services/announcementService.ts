
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;
const BUCKET = "announcement-images";

export type Announcement = {
  id: string;
  title: string;
  heading: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AnnouncementInput = {
  title: string;
  heading: string;
  description: string;
  image_url: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
  sort_order: number;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured.");
  }

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session?.access_token) {
      throw new Error("Please log in to manage announcements.");
    }

    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}/announcements${endpoint}`,
    { ...options, headers },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || "The announcement request failed.",
    );
  }

  return result as T;
}

// Upload an image to Supabase Storage and return its public URL.
export async function uploadAnnouncementImage(
  file: File,
): Promise<string> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("The image must be 5 MB or smaller.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (!session?.user) {
    throw new Error("Please log in to upload announcement images.");
  }

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const filePath =
    `${session.user.id}/${crypto.randomUUID()}.` +
    extensionByType[file.type];

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Image upload failed: ${uploadError.message}`,
    );
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Public storefront request.
export const getActiveAnnouncements = () =>
  request<Announcement[]>("/active", {}, false);

// Admin and Staff requests.
export const getAnnouncements = () =>
  request<Announcement[]>("");

export const createAnnouncement = (input: AnnouncementInput) =>
  request<Announcement>("", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateAnnouncement = (
  id: string,
  input: AnnouncementInput,
) =>
  request<Announcement>(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteAnnouncement = (id: string) =>
  request<{ message: string }>(
    `/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
