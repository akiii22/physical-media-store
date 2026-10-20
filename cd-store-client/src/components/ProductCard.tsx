
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 2;

  const handleAddToCart = () => {
    const result = addToCart(product);

    switch (result) {
      case "added":
        toast.success("Added to cart", {
          description: `${product.name} has been added to your cart.`,
        });
        break;

      case "quantity-increased":
        toast.success("Cart updated", {
          description: `Quantity increased for ${product.name}.`,
        });
        break;

      case "out-of-stock":
        toast.error("Out of stock", {
          description: `${product.name} is currently unavailable.`,
        });
        break;

      case "stock-limit-reached":
        toast.error("Stock limit reached", {
          description: `You cannot add more than ${product.stock} of this product.`,
        });
        break;
    }
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No Image
            </div>
          )}

          {/* Media Type Badge */}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
            {product.media_type}
          </span>

          {/* Stock Badges */}
          {isOutOfStock && (
            <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Out of Stock
            </span>
          )}

          {isLowStock && (
            <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
              Only {product.stock} left
            </span>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="p-5">
        {/* Category */}
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {product.categories?.name ?? "Uncategorized"}
        </p>

        {/* Name */}
        <Link to={`/products/${product.id}`}>
          <h2 className="line-clamp-2 min-h-12 text-lg font-semibold leading-6 text-gray-950 transition group-hover:text-gray-600">
            {product.name}
          </h2>
        </Link>

        {/* Condition */}
        <div className="mt-2">
          <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {product.condition}
          </span>
        </div>

        {/* Price and Stock */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-xl font-bold text-gray-950">
              ₱{product.price.toLocaleString("en-PH")}
            </p>
          </div>

          {!isOutOfStock && (
            <p className="text-right text-xs text-gray-500">
              {product.stock} in stock
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/products/${product.id}`}
            className="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            View Product
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-gray-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={16} />
            {isOutOfStock ? "Unavailable" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
