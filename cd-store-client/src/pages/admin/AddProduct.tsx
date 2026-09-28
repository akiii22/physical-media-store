import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Image as ImageIcon,
  Save,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  createProduct,
  getProducts,
  type ProductFormData,
} from "../../services/productServices";

import type { Category } from "../../types/product";

const AddProduct = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoadingCategories, setIsLoadingCategories] =
    useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    media_type: "CD",
    condition: "USED",
    price: "",
    stock: "",
    category_id: "",
    discount: "",
  });

  // ==========================================
  // LOAD CATEGORIES
  // ==========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);

        const products = await getProducts();

        const uniqueCategories = products
          .map((product) => product.categories)
          .filter(
            (category): category is Category =>
              category !== null
          );

        const categoryMap = new Map(
          uniqueCategories.map((category) => [
            category.id,
            category,
          ])
        );

        setCategories(
          Array.from(categoryMap.values())
        );
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load categories."
        );
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // ==========================================
  // CLEAN UP IMAGE PREVIEW
  // ==========================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE IMAGE
  // ==========================================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");

      event.target.value = "";
      return;
    }

    setError("");

    // Remove previous preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview(null);
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!form.price) {
      setError("Price is required.");
      return;
    }

    if (!form.stock) {
      setError("Stock is required.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (Number.isNaN(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      Number.isNaN(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      setError(
        "Stock must be a whole number greater than or equal to 0."
      );
      return;
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    try {
      setIsSaving(true);

      const productData: ProductFormData = {
        name: form.name.trim(),
        description: form.description.trim(),
        media_type: form.media_type,
        condition: form.condition,
        price,
        stock,
        category_id: form.category_id,
        image: image ?? undefined,

        // Discount intentionally not sent to backend.
      };

      await createProduct(productData);

      navigate("/admin/products");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create product."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/products")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Products
          </button>

          <p className="text-sm font-medium text-gray-500">
            Product Management
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Add Product
          </h1>

          <p className="mt-2 text-gray-600">
            Add a new item to your store inventory.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ==========================================
              BASIC INFORMATION
          ========================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the basic details of the product.
              </p>
            </div>

            <div className="space-y-5">

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Product Name
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Michael Jackson - Thriller"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the product..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
                />
              </div>

            </div>
          </section>

          {/* ==========================================
              PRODUCT DETAILS
          ========================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Product Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Specify the type, condition, and category.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* Category */}
              <div>
                <label
                  htmlFor="category_id"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Category
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={isLoadingCategories}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {isLoadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Type */}
              <div>
                <label
                  htmlFor="media_type"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Media Type
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  id="media_type"
                  name="media_type"
                  value={form.media_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400"
                >
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
              </div>

              {/* Condition */}
              <div>
                <label
                  htmlFor="condition"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Condition
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                </select>
              </div>

            </div>
          </section>

          {/* ==========================================
              PRICING & INVENTORY
          ========================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Pricing & Inventory
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Set the selling price and available stock.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Price
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    ₱
                  </span>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="350"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm outline-none focus:border-gray-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Stock
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </div>

              {/* Discount */}
              <div>
                <label
                  htmlFor="discount"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  Discount

                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    Demo
                  </span>
                </label>

                <div className="relative">
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none focus:border-gray-400 focus:bg-white"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    %
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Discount functionality will be added later.
                </p>
              </div>

            </div>
          </section>

          {/* ==========================================
              PRODUCT IMAGE
          ========================================== */}

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Product Image
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload an image for the product.
              </p>
            </div>

            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6">

              {imagePreview ? (
                <div className="space-y-4">

                  {/* Preview */}
                  <div className="overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="max-h-72 w-full object-contain"
                    />
                  </div>

                  {/* File Information */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {image?.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {image
                          ? `${(
                              image.size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Remove Image
                    </button>
                  </div>

                </div>
              ) : (
                <label
                  htmlFor="product-image"
                  className="flex cursor-pointer flex-col items-center justify-center py-10 text-center"
                >
                  <div className="mb-4 rounded-full bg-gray-100 p-4">
                    <ImageIcon
                      size={24}
                      className="text-gray-500"
                    />
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    Click to upload an image
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG, or WEBP · Maximum 5MB
                  </p>

                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

            </div>
          </section>

          {/* ==========================================
              ACTIONS
          ========================================== */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/products")
              }
              disabled={isSaving}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isLoadingCategories}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />

              {isSaving
                ? "Creating..."
                : "Create Product"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
};

export default AddProduct;