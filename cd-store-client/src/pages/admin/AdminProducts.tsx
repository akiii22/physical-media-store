import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AlertTriangle, Edit, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { deleteProduct, getProducts } from "../../services/productServices";
import type { Product } from "../../types/product";

const AdminProducts = () => {

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const {
    data: products = [],
    isLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const firstPage = await getProducts({ page: 1, limit: 48 });
      const allProducts = [...firstPage.data];

      if (firstPage.pagination.totalPages > 1) {
        const remainingPages = Array.from(
          { length: firstPage.pagination.totalPages - 1 },
          (_, index) => index + 2,
        );

        const results = await Promise.all(
          remainingPages.map((page) => getProducts({ page, limit: 48 })),
        );

        results.forEach((result) => allProducts.push(...result.data));
      }

      return allProducts;
    },
  });

  const {
    data: mediaTypes = [],
    isLoading: isLoadingMediaTypes,
    error: mediaTypesError,
  } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["media-types"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error("API URL is not configured.");
      }

      const response = await fetch(`${apiUrl}/media-types`);

      if (!response.ok) {
        throw new Error("Failed to load media types.");
      }

      const result: unknown = await response.json();
      const payload = result as
        | { data?: { id: string; name: string }[] }
        | { mediaTypes?: { id: string; name: string }[] }
        | { id: string; name: string }[];

      const list = Array.isArray(payload)
        ? payload
        : "data" in payload && Array.isArray(payload.data)
          ? payload.data
          : "mediaTypes" in payload && Array.isArray(payload.mediaTypes)
            ? payload.mediaTypes
            : [];

      return list
        .filter(
          (item): item is { id: string; name: string } =>
            Boolean(
              item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                item.name.trim(),
            ),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const error =
    productsError instanceof Error
      ? productsError.message
      : mediaTypesError instanceof Error
        ? mediaTypesError.message
        : "";

  useEffect(() => {
    if (productsError) {
      toast.error(
        productsError instanceof Error
          ? productsError.message
          : "Failed to load products.",
      );
    }
  }, [productsError]);

  useEffect(() => {
    if (mediaTypesError) {
      toast.error(
        mediaTypesError instanceof Error
          ? mediaTypesError.message
          : "Failed to load media types.",
      );
    }
  }, [mediaTypesError]);

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: async (_result, productId) => {
      queryClient.setQueryData<Product[]>(["admin-products"], (current = []) =>
        current.filter((product) => product.id !== productId),
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted successfully.");
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to delete product.";
      toast.error(message);
    },
  });

  // Delete product
  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    deleteProductMutation.mutate(productToDelete.id, {
      onSuccess: () => setProductToDelete(null),
    });
  };

  // Filter products
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
        product.media_type?.trim().toLowerCase() === mediaType.trim().toLowerCase();

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

  // Loading state
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

  // Page
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

            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"

          >

            <Plus size={18} />

            Add Product

          </button>

        </div>

        {/* Error */}

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refetchProducts()}
              className="cursor-pointer shrink-0 rounded-lg border border-red-200 px-3 py-2 font-medium transition hover:bg-red-100"
            >
              Retry loading products
            </button>
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
              onChange={(event) => setMediaType(event.target.value)}
              disabled={isLoadingMediaTypes}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400 disabled:cursor-wait disabled:opacity-60"
            >

              <option value="ALL">

                All Media Types

              </option>

              {isLoadingMediaTypes ? (
                <option value="" disabled>
                  Loading media types...
                </option>
              ) : mediaTypes.length > 0 ? (
                mediaTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No media types available
                </option>
              )}

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

                          className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"

                        >

                          <Edit size={15} />

                          Edit

                        </button>

                        <button

                          type="button"

                          onClick={() =>

                            handleDelete(product)

                          }

                          className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"

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

                    className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"

                  >

                    <Edit size={15} />

                    Edit

                  </button>

                  <button

                    type="button"

                    onClick={() =>

                      handleDelete(product)

                    }

                    className="cursor-pointer flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-red-600"

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

      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteProductMutation.isPending) {
              setProductToDelete(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={28} aria-hidden="true" />
            </div>
            <h2 id="delete-product-title" className="mt-4 text-center text-xl font-bold text-gray-900">
              Delete this product?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{productToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleteProductMutation.isPending}
                onClick={() => setProductToDelete(null)}
                className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteProductMutation.isPending}
                onClick={confirmDelete}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteProductMutation.isPending ? "Deleting..." : "Delete product"}
              </button>
            </div>
            <button
              type="button"
              aria-label="Close confirmation"
              disabled={deleteProductMutation.isPending}
              onClick={() => setProductToDelete(null)}
              className="cursor-pointer absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
};
export default AdminProducts;
