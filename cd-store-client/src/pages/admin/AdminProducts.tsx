import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  deleteProduct,
  getProducts,
} from "../../services/productServices";

import type { Product } from "../../types/product";

const AdminProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product.id);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    }
  };

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(searchValue) ||
        product.description
          ?.toLowerCase()
          .includes(searchValue) ||
        product.categories?.name
          .toLowerCase()
          .includes(searchValue);

      const matchesMediaType =
        mediaType === "ALL" ||
        product.media_type === mediaType;

      let matchesStock = true;

      if (stockFilter === "IN_STOCK") {
        matchesStock = product.stock > 0;
      }

      if (stockFilter === "LOW_STOCK") {
        matchesStock =
          product.stock > 0 && product.stock <= 3;
      }

      if (stockFilter === "OUT_OF_STOCK") {
        matchesStock = product.stock === 0;
      }

      return (
        matchesSearch &&
        matchesMediaType &&
        matchesStock
      );
    });
  }, [
    products,
    search,
    mediaType,
    stockFilter,
  ]);

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

            <p className="text-gray-600">
              Loading products...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Admin Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Products
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your physical media inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/products/new")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Products
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              In Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                products.filter(
                  (product) => product.stock > 0
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {
                products.filter(
                  (product) =>
                    product.stock > 0 &&
                    product.stock <= 3
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Out of Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {
                products.filter(
                  (product) => product.stock === 0
                ).length
              }
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* Media Type */}
            <select
              value={mediaType}
              onChange={(event) =>
                setMediaType(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400"
            >
              <option value="ALL">
                All Media Types
              </option>

              <option value="CD">CD</option>
              <option value="CASSETTE">
                Cassette
              </option>
              <option value="VINYL">
                Vinyl
              </option>
              <option value="VCD">VCD</option>
              <option value="DVD">DVD</option>
              <option value="OTHER">
                Other
              </option>
            </select>

            {/* Stock */}
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value)
              }
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400"
            >
              <option value="ALL">
                All Stock
              </option>

              <option value="IN_STOCK">
                In Stock
              </option>

              <option value="LOW_STOCK">
                Low Stock
              </option>

              <option value="OUT_OF_STOCK">
                Out of Stock
              </option>
            </select>

          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-gray-900">
                  Product Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredProducts.length} product
                  {filteredProducts.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <Package
                size={22}
                className="text-gray-400"
              />

            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-4">
                    Product
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Condition
                  </th>

                  <th className="px-6 py-4">
                    Category
                  </th>

                  <th className="px-6 py-4">
                    Price
                  </th>

                  <th className="px-6 py-4">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* Product */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package
                              size={20}
                              className="text-gray-400"
                            />
                          )}

                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                            {product.description ||
                              "No description"}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {product.media_type}
                      </span>
                    </td>

                    {/* Condition */}
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {product.condition}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-5 text-sm text-gray-600">
                      {product.categories?.name ||
                        "Uncategorized"}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-5 font-semibold text-gray-900">
                      ₱
                      {Number(
                        product.price
                      ).toLocaleString()}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-5">
                      {product.stock === 0 ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Out of Stock
                        </span>
                      ) : product.stock <= 3 ? (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          {product.stock} left
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {product.stock} in stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/products/${product.id}/edit`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          <Edit size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product)
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden">

            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="p-5"
              >

                <div className="flex gap-4">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package
                        size={22}
                        className="text-gray-400"
                      />
                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {product.media_type} ·{" "}
                      {product.condition}
                    </p>

                    <p className="mt-2 font-bold text-gray-900">
                      ₱
                      {Number(
                        product.price
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Stock: {product.stock}
                    </p>

                  </div>

                </div>

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/admin/products/${product.id}/edit`
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                  >
                    <Edit size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(product)
                    }
                    className="flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

              </div>
            ))}

          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Package
                  size={24}
                  className="text-gray-400"
                />
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                No products found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>

            </div>
          )}

        </div>
      </div>
    </main>
  );
};

export default AdminProducts;