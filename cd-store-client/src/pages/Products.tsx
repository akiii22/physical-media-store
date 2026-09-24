import {useState, useEffect} from "react";
import type {Product} from "../types/product";
import { getProducts } from "../services/productServices";
import ProductGrid from "../components/ProductGrid";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState("ALL");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();

        setProducts(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMediaType = selectedMediaType === "ALL" || product.media_type === selectedMediaType;

    return matchesSearch && matchesMediaType;
  })

  if (loading) {
    return <p className="p-6">Loading products...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

    return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">
            Physical Media Store
          </p>

          <h1 className="text-4xl font-bold text-gray-900">
            Browse Our Collection
          </h1>

          <p className="mt-2 text-gray-600">
            CDs, vinyl, cassettes, VCDs, DVDs and more.
          </p>
        </header>

        <div className="mt-6 mb-6">
            <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-900"
  />

  <div className="mt-4 mb-4 flex flex-wrap gap-2">
  {[
    "ALL",
    "CD",
    "CASSETTE",
    "VINYL",
    "VCD",
    "DVD",
    "OTHER",
  ].map((type) => (
    <button
      key={type}
      type="button"
      onClick={() => setSelectedMediaType(type)}
      className={`rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer ${
        selectedMediaType === type
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-700 hover:bg-gray-200"
      }`}
    >
      {type === "ALL" ? "All" : type}
    </button>
  ))}
</div>
</div>

        <ProductGrid products={filteredProducts} />
      </div>
    </main>

    );
}

export default Products