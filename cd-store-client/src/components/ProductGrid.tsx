import type {Product} from "../types/product";
import ProductCard from "./ProductCard";


type ProductGridProps = {
    products: Product[]
}

const ProductGrid = ({products}: ProductGridProps) => {
     if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center">
        <p className="text-gray-500">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}

export default ProductGrid