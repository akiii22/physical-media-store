import { PackageOpen } from "lucide-react";

import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

type ProductGridProps = {
  products: Product[];
};

const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <PackageOpen size={25} className="text-gray-500" />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No products found
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Try changing your search or selecting a different media type.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;