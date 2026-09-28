import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ImageIcon,
  Save,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getProductById,
  getProducts,
  updateProduct,
  type ProductFormData,
} from "../../services/productServices";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [categories, setCategories] = useState<
    { id: string; name: string }[]
  >([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    media_type: "CD",
    condition: "USED",
    price: "",
    stock: "",
    category_id: "",
    discount: "",
  });

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    null
  );

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load product
  // --------------------------------------------------

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const [product, products] = await Promise.all([
          getProductById(id),
          getProducts(),
        ]);

        // Get unique categories
        const uniqueCategories = Array.from(
          new Map(
            products
              .filter((product) => product.categories)
              .map((product) => [
                product.categories!.id,
                product.categories!,
              ])
          ).values()
        );

        setCategories(uniqueCategories);

        setFormData({
          name: product.name,
          description: product.description || "",
          media_type: product.media_type,
          condition: product.condition,
          price: String(product.price),
          stock: String(product.stock),
          category_id: product.categories?.id || "",
          discount: ""
        });

        setCurrentImageUrl(product.image_url);
      } catch (error) {
        console.error("Error loading product:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // --------------------------------------------------
  // Cleanup image preview
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // --------------------------------------------------
  // Form changes
  // --------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // Image selection
  // --------------------------------------------------

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
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

  // --------------------------------------------------
  // Remove newly selected image
  // --------------------------------------------------

  const handleRemoveNewImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview(null);
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!id) {
      setError("Product ID is missing.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!formData.category_id) {
      setError("Please select a category.");
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      formData.stock === "" ||
      Number(formData.stock) < 0
    ) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const productData: ProductFormData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        media_type: formData.media_type,
        condition: formData.condition,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category_id: formData.category_id,
        image: image ?? undefined,

        // Demo only
        discount:
          formData.discount === ""
            ? undefined
            : Number(formData.discount),
      };

      await updateProduct(id, productData);

      navigate("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-sm text-gray-500">
          Loading product...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update the product information and image.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main information */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                  Product Information
                </h2>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Product Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Enter product description"
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  {/* Type + Condition */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Media Type
                      </label>

                      <select
                        name="media_type"
                        value={formData.media_type}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="CD">CD</option>
                        <option value="CASSETTE">Cassette</option>
                        <option value="VINYL">Vinyl</option>
                        <option value="VCD">VCD</option>
                        <option value="DVD">DVD</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Condition
                      </label>

                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="NEW">New</option>
                        <option value="USED">Used</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Category
                    </label>

                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">
                        Select category
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
                </div>
              </div>

              {/* Inventory */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                  Pricing & Inventory
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Price */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Price
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        ₱
                      </span>

                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Stock
                    </label>

                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      Discount
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                        DEMO
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Discount is currently for demonstration only and
                  is not saved to the database.
                </p>
              </div>
            </div>

            {/* Image */}
            <div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                  Product Image
                </h2>

                {/* Image preview */}
                {(imagePreview || currentImageUrl) ? (
                  <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={
                        imagePreview ||
                        currentImageUrl ||
                        undefined
                      }
                      alt={formData.name || "Product"}
                      className="h-64 w-full object-contain"
                    />

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveNewImage}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition hover:bg-gray-100"
                        title="Remove new image"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="text-center">
                      <ImageIcon
                        size={40}
                        className="mx-auto mb-3 text-gray-400"
                      />

                      <p className="text-sm font-medium text-gray-600">
                        No image
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Upload an image below
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload */}
                <label className="block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  {image
                    ? "Choose Different Image"
                    : currentImageUrl
                      ? "Replace Image"
                      : "Choose Image"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-xs leading-5 text-gray-400">
                  JPG, PNG, or WEBP. Maximum file size: 5MB.
                </p>

                {image && (
                  <p className="mt-2 truncate text-xs text-gray-500">
                    New image: {image.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;