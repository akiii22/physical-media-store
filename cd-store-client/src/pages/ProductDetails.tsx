import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import { getProductById } from "../services/productServices";
import type { Product, ProductImage } from "../types/product";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { addToCart } = useCart();

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
        setSelectedImageIndex(0);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    addToCart(product);
    setAddedToCart(true);

    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-6 h-5 w-32 rounded bg-gray-200" />

          <div className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">
            <div className="aspect-square bg-gray-200 md:aspect-auto md:min-h-137.5" />

            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="mt-4 h-10 w-3/4 rounded bg-gray-200" />

              <div className="mt-6 flex gap-2">
                <div className="h-8 w-20 rounded-full bg-gray-200" />
                <div className="h-8 w-20 rounded-full bg-gray-200" />
              </div>

              <div className="mt-8 h-8 w-32 rounded bg-gray-200" />

              <div className="mt-8 space-y-2">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>

              <div className="mt-8 h-12 w-full rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Product unavailable
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error || "Product not found."}
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 2;

  // The primary image comes from products.image_url.
  // Additional images come from product_images.
  const galleryImages: ProductImage[] = [
    ...(product.image_url
      ? [
          {
            id: "primary",
            image_url: product.image_url,
            display_order: 1,
          },
        ]
      : []),
    ...(product.product_images ?? []),
  ].sort((a, b) => a.display_order - b.display_order);

  // Prevent an invalid selected index if the gallery changes.
  const safeImageIndex = Math.min(
    selectedImageIndex,
    Math.max(galleryImages.length - 1, 0)
  );

  const selectedImage = galleryImages[safeImageIndex];

  const showPreviousImage = () => {
    if (galleryImages.length <= 1) return;

    setSelectedImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  };

  const showNextImage = () => {
    if (galleryImages.length <= 1) return;

    setSelectedImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back to Products */}
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Back to Collection
        </Link>

        <div className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">
          {/* =========================================
              PRODUCT IMAGE GALLERY
          ========================================== */}
          <div className="bg-gray-100 p-4 sm:p-5">
            {/* Main Image */}
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-white">
              {selectedImage ? (
                <img
                  src={selectedImage.image_url}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full min-h-[400px] items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

              {/* Media Type Badge */}
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-800 shadow-sm backdrop-blur">
                {product.media_type}
              </span>

              {/* Out of Stock Badge */}
              {isOutOfStock && (
                <span className="absolute right-4 top-4 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
                  Out of Stock
                </span>
              )}

              {/* Previous / Next */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={showPreviousImage}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={`View image ${index + 1}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                      index === safeImageIndex
                        ? "border-gray-950 ring-2 ring-gray-950/10"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================================
              PRODUCT DETAILS
          ========================================== */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            {/* Category */}
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              {product.categories?.name ?? "Uncategorized"}
            </p>

            {/* Product Name */}
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-950 sm:text-4xl">
              {product.name}
            </h1>

            {/* Product Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {product.media_type}
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {product.condition}
              </span>
            </div>

            {/* Price */}
            <div className="mt-7">
              <p className="text-sm text-gray-500">Price</p>
              <p className="mt-1 text-3xl font-bold text-gray-950">
                ₱{product.price.toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <div className="mt-7 border-t border-gray-100 pt-6">
              <h2 className="text-sm font-semibold text-gray-900">
                About this item
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Stock Status */}
            <div className="mt-6">
              {isOutOfStock ? (
                <p className="text-sm font-semibold text-red-600">
                  Currently out of stock
                </p>
              ) : isLowStock ? (
                <p className="text-sm font-semibold text-amber-600">
                  Only {product.stock} left in stock
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Check size={16} />
                  {product.stock} available
                </p>
              )}
            </div>

            {/* Add to Cart / Cart Actions */}
            {!addedToCart ? (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                <ShoppingCart size={18} />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
            ) : (
              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 px-6 py-3.5 text-sm font-semibold text-green-700">
                  <Check size={18} />
                  Added to Cart
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/cart"
                    className="flex-1 rounded-xl bg-gray-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    View Cart
                  </Link>

                  <Link
                    to="/products"
                    className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}

            {/* Continue Shopping */}
            {!addedToCart && (
              <Link
                to="/products"
                className="mt-3 text-center text-sm font-medium text-gray-500 transition hover:text-gray-950"
              >
                Continue Shopping
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
