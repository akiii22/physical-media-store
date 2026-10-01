import type { Product } from "../types/product";
import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// PRODUCT FORM DATA
// ==========================================

export type ProductFormData = {
  name: string;
  description: string;
  media_type: string;
  condition: string;
  price: number;
  stock: number;
  category_id: string;

  // Used by Add Product.
  // Allows up to 5 product images.
  images?: File[];

  // Used by Edit Product for the existing
  // single-image update flow.
  image?: File;

  // Discount is currently frontend/demo only.
  discount?: number;
};

// ==========================================
// GET ACCESS TOKEN
// ==========================================

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  return session.access_token;
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(
      `${API_URL}/products`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to fetch products."
      );
    }

    return result.data;
  } catch (error) {
    console.error(
      "Error fetching products:",
      error
    );

    throw error;
  }
};

// ==========================================
// GET PRODUCT BY ID
// ==========================================

export const getProductById = async (
  id: string
): Promise<Product> => {
  try {
    const response = await fetch(
      `${API_URL}/products/${id}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to fetch product."
      );
    }

    return result.data;
  } catch (error) {
    console.error(
      "Error fetching product:",
      error
    );

    throw error;
  }
};

// ==========================================
// CREATE PRODUCT
// ==========================================

export const createProduct = async (
  product: ProductFormData
) => {
  try {
    // Get the logged-in admin's access token.
    const token = await getAccessToken();

    const formData = new FormData();

    // ==========================================
    // BASIC PRODUCT INFORMATION
    // ==========================================

    formData.append(
      "name",
      product.name
    );

    formData.append(
      "description",
      product.description
    );

    formData.append(
      "media_type",
      product.media_type
    );

    formData.append(
      "condition",
      product.condition
    );

    formData.append(
      "price",
      String(product.price)
    );

    formData.append(
      "stock",
      String(product.stock)
    );

    formData.append(
      "category_id",
      product.category_id
    );

    // ==========================================
    // PRODUCT IMAGES
    // ==========================================
    //
    // The backend uses:
    //
    // upload.array("images", 5)
    //
    // Therefore every selected file must use
    // the field name "images".
    //
    // The first image becomes the main image.
    // Additional images are stored in
    // product_images.
    // ==========================================

    if (product.images?.length) {
      product.images.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });
    }

    // ==========================================
    // SEND REQUEST
    // ==========================================

    const response = await fetch(
      `${API_URL}/products`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        // IMPORTANT:
        // Do NOT manually set Content-Type.
        //
        // The browser automatically creates the
        // multipart/form-data boundary.
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to create product."
      );
    }

    return result.data;
  } catch (error) {
    console.error(
      "Error creating product:",
      error
    );

    throw error;
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================
//
// NOTE:
// Edit Product still uses the original
// single-image upload.
//
// Backend currently has:
// upload.single("image")
//
// We are intentionally NOT changing that yet.
// Gallery editing will be handled separately.
// ==========================================

export const updateProduct = async (
  id: string,
  product: ProductFormData
) => {
  try {
    const token = await getAccessToken();

    const formData = new FormData();

    // ==========================================
    // BASIC PRODUCT INFORMATION
    // ==========================================

    formData.append(
      "name",
      product.name
    );

    formData.append(
      "description",
      product.description
    );

    formData.append(
      "media_type",
      product.media_type
    );

    formData.append(
      "condition",
      product.condition
    );

    formData.append(
      "price",
      String(product.price)
    );

    formData.append(
      "stock",
      String(product.stock)
    );

    formData.append(
      "category_id",
      product.category_id
    );

    // ==========================================
    // SINGLE IMAGE UPDATE
    // ==========================================
    //
    // This is intentionally kept separate from
    // the new multiple-image create flow.
    //
    // Edit Product currently sends:
    //
    // image
    //
    // and the backend expects:
    //
    // upload.single("image")
    // ==========================================

    if (product.image) {
      formData.append(
        "image",
        product.image
      );
    }

    // ==========================================
    // SEND REQUEST
    // ==========================================

    const response = await fetch(
      `${API_URL}/products/${id}`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to update product."
      );
    }

    return result.data;
  } catch (error) {
    console.error(
      "Error updating product:",
      error
    );

    throw error;
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct = async (
  id: string
) => {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `${API_URL}/products/${id}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to delete product."
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Error deleting product:",
      error
    );

    throw error;
  }
};