import type { Product } from "../types/product";

const API_URL = "http://localhost:3000/api"

export const getProducts = async (): Promise<Product[]> => {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const products = await response.json();
        return products.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
}

}

export const getProductById = async (
  id: string
): Promise<Product> => {
  try {
    const response = await fetch(
      `${API_URL}/products/${id}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch product: ${response.status}`
      );
    }

    const result = await response.json();

    return result.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }

}