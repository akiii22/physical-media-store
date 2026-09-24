import {useEffect, useState} from "react";
import {useParams, Link} from "react-router-dom";
import {getProductById} from "../services/productServices";
import type {Product} from "../types/product";
import { useCart } from "../context/CartContext";
const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const {addToCart} = useCart();
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const data = await getProductById(id);

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading product...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">
          {error || "Product not found."}
        </p>

        <Link
          to="/products"
          className="rounded-lg bg-gray-900 px-4 py-2 text-white"
        >
          Back to Products
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/products"
          className="mb-6 inline-block text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Products
        </Link>

        <div className="grid gap-10 rounded-2xl bg-white p-8 shadow-sm md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              {product.categories?.name ?? "Uncategorized"}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <div className="mt-4 flex gap-3">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {product.media_type}
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {product.condition}
              </span>
            </div>

            <p className="mt-6 text-3xl font-bold">
              ₱{product.price.toLocaleString()}
            </p>

            <p className="mt-4 text-gray-600">
              {product.description ||
                "No description available."}
            </p>

            <p className="mt-6 text-sm text-gray-500">
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </p>

            <button
              type="button"
              disabled={product.stock === 0}
              onClick={() => {
  console.log("Adding product:", product);
  addToCart(product);
}}
              className="mt-6 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;