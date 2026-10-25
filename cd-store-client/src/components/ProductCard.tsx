
import { Link } from "react-router-dom";
import { ShoppingCart, Image as ImageIcon } from "lucide-react";
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      {/* Product Image */}
      <Link
        to={`/products/${product.id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon size={30} strokeWidth={1.5} />
              <span className="text-xs">No image available</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 opacity-60" />

          {/* Media Type */}
          <span className="absolute left-3 top-3 rounded-md border border-white/60 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-800 shadow-sm backdrop-blur">
            {product.media_type}
          </span>

          {/* Stock Status */}
          {isOutOfStock ? (
            <span className="absolute right-3 top-3 rounded-md bg-gray-900/90 px-2.5 py-1 text-[10px] font-semibold text-white">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="absolute right-3 top-3 rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 shadow-sm">
              Only {product.stock} left
            </span>
          ) : null}
        </div>
      </Link>

      {/* Product Information */}
  
{/* Product Information */}
<div className="flex flex-1 flex-col p-3">
  {/* Category */}
  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
    {product.categories?.name ?? "Uncategorized"}
  </p>

  {/* Product Name */}
  <Link to={`/products/${product.id}`}>
    <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-900 transition-colors group-hover:text-gray-600">
      {product.name}
    </h2>
  </Link>

  {/* Condition */}
  <div className="mt-1.5">
    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
      {product.condition}
    </span>
  </div>

  {/* Price and Stock */}
  <div className="mt-3 flex items-end justify-between gap-2 border-t border-gray-100 pt-3">
    <div>
      <p className="text-[10px] text-gray-400">Price</p>
      <p className="text-lg font-bold tracking-tight text-gray-950">
        ₱
        {Number(product.price).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>

    <p
      className={`pb-0.5 text-right text-[10px] font-medium ${
        isOutOfStock
          ? "text-red-600"
          : isLowStock
            ? "text-amber-700"
            : "text-gray-400"
      }`}
    >
      {isOutOfStock
        ? "Out of stock"
        : `${product.stock} in stock`}
    </p>
  </div>

  {/* Actions */}
  <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
    <Link
      to={`/products/${product.id}`}
      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-gray-200 px-1.5 text-center text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
    >
      View Product
    </Link>

    <button
      type="button"
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-gray-950 px-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      aria-label={`Add ${product.name} to cart`}
    >
      <ShoppingCart size={13} />
      <span>{isOutOfStock ? "Unavailable" : "Add to Cart"}</span>
    </button>
  </div>
</div>

    </article>
  );
};

export default ProductCard;
