
import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import ProductGrid from "../components/ProductGrid";
import {
  useMediaTypes,
  useNewReleases,
  useProducts,
} from "../hooks/useProducts";
import AnnouncementCarousel from "../components/AnnouncementCarousel";

const PAGE_SIZE = 12;

const Products = () => {
  // Search, filter, and pagination state.
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState("ALL");
  const [page, setPage] = useState(1);

  // Debounce search input to avoid querying on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // TanStack Query: paginated and filtered products.
  const productsQuery = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    mediaType: selectedMediaType,
  });

  // TanStack Query: latest four products.
  const newReleasesQuery = useNewReleases();

  // TanStack Query: media types for the filter buttons.
  const mediaTypesQuery = useMediaTypes();

  const products = productsQuery.data?.data ?? [];
  const newReleases = newReleasesQuery.data?.data ?? [];
  const mediaTypes = mediaTypesQuery.data ?? [];

  const pagination = productsQuery.data?.pagination ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const loading = productsQuery.isPending;
  const mediaTypesLoading = mediaTypesQuery.isPending;

  const error = productsQuery.isError
    ? productsQuery.error instanceof Error
      ? productsQuery.error.message
      : "Failed to load products."
    : "";

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedMediaType !== "ALL";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedMediaType("ALL");
    setPage(1);
  };

  const scrollToCollection = () => {
    document.getElementById("collection")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Initial loading state.
  if (loading && !productsQuery.data) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-4 h-10 w-80 max-w-full rounded bg-gray-200" />
            <div className="mt-4 h-5 w-full max-w-2xl rounded bg-gray-200" />
          </div>

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

  // Initial error state with query retry.
  if (productsQuery.isError && !productsQuery.data) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <h2 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void productsQuery.refetch()}
              disabled={productsQuery.isFetching}
              className="mt-4 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {productsQuery.isFetching ? "Retrying..." : "Try again"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <AnnouncementCarousel />
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}

{/* Hero */}
<header className="mb-10">
  <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
    Find something worth keeping.
  </h1>

  <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
    Explore your favorites, discover new releases, and find CDs, vinyl
    records, cassettes, VCDs, DVDs, and more.
  </p>
</header>

        {/* Search and filters */}
        <section className="mb-12 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <SlidersHorizontal size={17} />
            Find what you&apos;re looking for
          </div>

          <div className="relative mt-4">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedMediaType("ALL");
                setPage(1);
              }}
              aria-pressed={selectedMediaType === "ALL"}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedMediaType === "ALL"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Media
            </button>

            {mediaTypesLoading ? (
              <span className="px-3 py-2 text-sm text-gray-500">
                Loading media types...
              </span>
            ) : mediaTypes.length === 0 ? (
              <span className="px-3 py-2 text-sm text-amber-700">
                Media type filters are currently unavailable.
              </span>
            ) : (
              mediaTypes.map((type) => {
                const isSelected =
                  selectedMediaType.trim().toUpperCase() ===
                  type.name.trim().toUpperCase();

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedMediaType(type.name);
                      setPage(1);
                    }}
                    aria-pressed={isSelected}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "bg-gray-950 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.name}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* New releases */}
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
                onClick={(event) => {
                  event.preventDefault();
                  scrollToCollection();
                }}
                className="hidden items-center gap-1 text-sm font-semibold text-gray-700 transition hover:text-gray-950 sm:flex"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductGrid products={newReleases} />
          </section>
        )}

        {/* Collection */}
        <section id="collection" aria-busy={productsQuery.isFetching}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Browse
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
                Collection
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "item" : "items"} found
                {pagination.total > 0 && (
                  <>
                    {" "}
                    · Page {pagination.page} of {pagination.totalPages}
                  </>
                )}
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

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
              <button
                type="button"
                onClick={() => void productsQuery.refetch()}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="aspect-square animate-pulse bg-gray-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No products found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try another search or select a different media type.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <nav
              aria-label="Product pagination"
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage ||
                  productsQuery.isFetching
                }
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                  scrollToCollection();
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage ||
                  productsQuery.isFetching
                }
                onClick={() => {
                  setPage((current) => current + 1);
                  scrollToCollection();
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
    </>
  );
};

export default Products;
