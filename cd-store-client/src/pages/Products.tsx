import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import type { Product } from "../types/product";
import { getProducts } from "../services/productServices";
import ProductGrid from "../components/ProductGrid";

const MEDIA_TYPES = [
  "ALL",
  "CD",
  "CASSETTE",
  "VINYL",
  "VCD",
  "DVD",
  "OTHER",
];

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
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.categories?.name?.toLowerCase().includes(search);

    const matchesMediaType =
      selectedMediaType === "ALL" ||
      product.media_type === selectedMediaType;

    return matchesSearch && matchesMediaType;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-3 h-10 w-80 rounded bg-gray-200" />
            <div className="mt-3 h-5 w-96 max-w-full rounded bg-gray-200" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="aspect-square animate-pulse bg-gray-200" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero / Page Header */}
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Physical Media Store
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Browse Our Collection
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Discover CDs, vinyl records, cassettes, VCDs, DVDs, and other
            physical media.
          </p>
        </header>

        {/* Search & Filter */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <SlidersHorizontal size={17} />
            Find what you're looking for
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          {/* Media Type Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {MEDIA_TYPES.map((type) => {
              const isSelected = selectedMediaType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMediaType(type)}
                  className={`rounded-full cursor-pointer px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "bg-gray-950 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type === "ALL" ? "All Media" : type}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Collection
            </h2>

            <p className="text-sm text-gray-500">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"} found
            </p>
          </div>

          {(searchTerm || selectedMediaType !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedMediaType("ALL");
              }}
              className="text-left text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-gray-950 sm:text-right"
            >
              Clear filters
            </button>
          )}
        </div>

        <ProductGrid products={filteredProducts} />
      </div>
    </main>
  );
};

export default Products;