import type {Product} from "../types/product";
import { Link } from "react-router-dom";
type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {

    return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100">
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

      {/* Product Information */}
      <div className="p-5">
        <p className="mb-1 text-sm font-medium text-gray-500">
          {product.categories?.name ?? "Uncategorized"}
        </p>

        <h2 className="line-clamp-2 text-lg font-semibold text-gray-900">
          {product.name}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span>{product.media_type}</span>
          <span>•</span>
          <span>{product.condition}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-bold text-gray-900">
            ₱{product.price.toLocaleString()}
          </p>

          <span className="text-sm text-gray-500">
            {product.stock} in stock
          </span>
        </div>

        <Link
  to={`/products/${product.id}`}
  className="mt-4 block w-full rounded-lg bg-gray-900 px-4 py-2.5 text-center font-medium text-white transition hover:bg-gray-700"
>
  View Product
</Link>
      </div>
    </article>
  );
}

export default ProductCard;