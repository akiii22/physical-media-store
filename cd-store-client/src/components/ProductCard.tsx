import { Link } from "react-router-dom";
import type { Product } from "../types/product";

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 2;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
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

          {/* Stock Badge */}
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

        {/* Price / Stock */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Price</p>

            <p className="text-xl font-bold text-gray-950">
              ₱{product.price.toLocaleString()}
            </p>
          </div>

          {!isOutOfStock && (
            <p className="text-right text-xs text-gray-500">
              {product.stock} in stock
            </p>
          )}
        </div>

        {/* View Product */}
        <Link
          to={`/products/${product.id}`}
          className={`mt-5 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
            isOutOfStock
              ? "bg-gray-100 text-gray-400"
              : "bg-gray-950 text-white hover:bg-gray-800"
          }`}
        >
          {isOutOfStock ? "View Product" : "View Product"}
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;