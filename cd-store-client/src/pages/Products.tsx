import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

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

  /*
   * New Releases
   *
   * Uses the existing created_at field.
   * No database changes are required.
   */
  const newReleases = useMemo(() => {
    return [...products]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 4);
  }, [products]);

  /*
   * Search + Media Type Filtering
   *
   * Existing functionality is preserved.
   */
  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.categories?.name?.toLowerCase().includes(search);

      const matchesMediaType =
        selectedMediaType === "ALL" ||
        product.media_type === selectedMediaType;

      return matchesSearch && matchesMediaType;
    });
  }, [products, searchTerm, selectedMediaType]);

  const hasActiveFilters =
    searchTerm || selectedMediaType !== "ALL";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedMediaType("ALL");
  };

  /*
   * Loading State
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Skeleton */}
          <div className="mb-10 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />

            <div className="mt-4 h-10 w-80 max-w-full rounded bg-gray-200" />

            <div className="mt-4 h-5 w-full max-w-2xl rounded bg-gray-200" />
          </div>

          {/* Search Skeleton */}
          <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-5 h-12 w-full animate-pulse rounded-xl bg-gray-200" />

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-9 w-20 animate-pulse rounded-full bg-gray-200"
                />
              ))}
            </div>
          </div>

          {/* Product Skeleton */}
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

  /*
   * Error State
   */
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HERO / PAGE HEADER
        ====================================================== */}
        <header className="mb-10">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            <Sparkles size={15} />
            Physical Media Store
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
            Find something worth keeping.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Explore our collection of CDs, vinyl records, cassettes,
            VCDs, DVDs, and other physical media.
          </p>
        </header>

        {/* =====================================================
            SEARCH & FILTERS
        ====================================================== */}
        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
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
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
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

        {/* =====================================================
            NEW RELEASES
        ====================================================== */}
        {newReleases.length > 0 && !hasActiveFilters && (
          <section className="mb-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-gray-700" />

                  <h2 className="text-xl font-bold text-gray-950 sm:text-2xl">
                    New Releases
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  The latest additions to our collection.
                </p>
              </div>

              <Link
                to="#collection"
                className="hidden items-center gap-1 text-sm font-semibold text-gray-700 transition hover:text-gray-950 sm:flex"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={newReleases} />
          </section>
        )}

        {/* =====================================================
            COLLECTION
        ====================================================== */}
        <section id="collection">
          {/* Results Header */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Browse
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
                Collection
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "item"
                  : "items"}{" "}
                found
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer text-left text-sm font-medium text-gray-600 underline underline-offset-4 transition hover:text-gray-950 sm:text-right"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Products */}
          <ProductGrid products={filteredProducts} />
        </section>
      </div>
    </main>
  );
};

export default Products;