import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ChangeEvent,
  DragEvent,
  FormEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Save,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createProduct,
  type ProductFormData,
} from "../../services/productServices";
type Category = { id: string; name: string };
type MediaType = { id: string; name: string; created_at?: string };
const API_URL = import.meta.env.VITE_API_URL;

const MAX_IMAGES = 5;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [

  "image/jpeg",

  "image/png",

  "image/webp",

];

const AddProduct = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ==========================================
  // STATE
  // ==========================================
  const [categories, setCategories] = useState<Category[]>([]);

  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);

  const [isLoadingMediaTypes, setIsLoadingMediaTypes] = useState(true);

  // Actual selected image files.
  const [images, setImages] = useState<File[]>([]);

  // Temporary browser preview URLs.
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Drag-and-drop visual state.
  const [isDragging, setIsDragging] = useState(false);

  const [isLoadingCategories, setIsLoadingCategories] =

    useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({

    name: "",

    description: "",

    media_type: "",

    condition: "USED",

    price: "",

    stock: "",

    category_id: "",

    discount: "",

  });

  const createProductMutation = useMutation({
    mutationFn: (productData: ProductFormData) => createProduct(productData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowSuccessModal(true);
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create product.";
      setError(message);
      toast.error(message);
    },
  });

  // ==========================================
  // LOAD CATEGORIES AND MEDIA TYPES
  useEffect(() => {

    const loadCategories = async () => {

      if (!API_URL) {

        setError("VITE_API_URL is not configured.");

        setIsLoadingCategories(false);

        return;

      }

      try {

        setIsLoadingCategories(true);

        const response = await fetch(`${API_URL}/categories`);

        const result = await response.json();

        if (!response.ok) {

          throw new Error(result.message || "Failed to load categories.");

        }

        setCategories(Array.isArray(result.data) ? result.data : []);

      } catch (loadError) {

        console.error("Failed to load categories:", loadError);

        setError(

          loadError instanceof Error

            ? loadError.message

            : "Failed to load categories."

        );

      } finally {

        setIsLoadingCategories(false);

      }

    };

    const loadMediaTypes = async () => {

      if (!API_URL) {

        setIsLoadingMediaTypes(false);

        return;

      }

      try {

        setIsLoadingMediaTypes(true);

        const response = await fetch(`${API_URL}/media-types`);

        const result: unknown = await response.json();

        if (!response.ok) {

          throw new Error("Failed to load media types.");

        }

        const payload = result as

          | { data?: MediaType[]; mediaTypes?: MediaType[] }

          | MediaType[];

        const list = Array.isArray(payload)

          ? payload

          : Array.isArray(payload.data)

            ? payload.data

            : Array.isArray(payload.mediaTypes)

              ? payload.mediaTypes

              : [];

        setMediaTypes(list);

        if (list.length === 0) {

          setError("No media types are available. Add one in Admin Settings.");

        }

      } catch (loadError) {

        console.error("Failed to load media types:", loadError);

        setError(

          loadError instanceof Error

            ? loadError.message

            : "Failed to load media types."

        );

      } finally {

        setIsLoadingMediaTypes(false);

      }

    };

    void loadCategories();

    void loadMediaTypes();

  }, []);

  // CLEAN UP IMAGE PREVIEW URLS
  // ==========================================
  useEffect(() => {

    return () => {

      imagePreviews.forEach((preview) => {

        URL.revokeObjectURL(preview);

      });

    };

  }, [imagePreviews]);

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================
  const handleChange = (

    event: ChangeEvent<

      HTMLInputElement |

        HTMLTextAreaElement |

        HTMLSelectElement

    >

  ) => {

    const { name, value } = event.target;

    setForm((current) => ({

      ...current,

      [name]: value,

    }));

  };

  // ==========================================
  // HANDLE IMAGE FILES
  // ==========================================
  const handleImageFiles = (selectedFiles: File[]) => {

    if (selectedFiles.length === 0) {

      return;

    }

    // Validate file type and size first.
    for (const file of selectedFiles) {

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

        setError(

          `"${file.name}" is not a supported image. Please use JPG, PNG, or WEBP.`

        );

        return;

      }

      if (file.size > MAX_FILE_SIZE) {

        setError(

          `"${file.name}" is too large. Each image must be smaller than 5MB.`

        );

        return;

      }

    }

    // Prevent adding the exact same file twice.
    const existingFileKeys = new Set(

      images.map(

        (file) =>

          `${file.name}-${file.size}-${file.lastModified}`

      )

    );

    const newFiles = selectedFiles.filter((file) => {

      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

      return !existingFileKeys.has(fileKey);

    });

    if (newFiles.length === 0) {

      setError("These images have already been selected.");

      return;

    }

    // Calculate how many image slots remain.
    const remainingSlots = MAX_IMAGES - images.length;

    if (remainingSlots <= 0) {

      setError(

        `You can upload a maximum of ${MAX_IMAGES} images.`

      );

      return;

    }

    // Do not partially add a batch.
    if (newFiles.length > remainingSlots) {

      setError(

        `You can only add ${remainingSlots} more ${

          remainingSlots === 1 ? "image" : "images"

        }. Maximum is ${MAX_IMAGES} images.`

      );

      return;

    }

    // Create previews only for the newly added files.
    const newPreviews = newFiles.map((file) =>

      URL.createObjectURL(file)

    );

    // IMPORTANT:
    // Append instead of replacing existing images.
    setImages((currentImages) => [

      ...currentImages,

      ...newFiles,

    ]);

    setImagePreviews((currentPreviews) => [

      ...currentPreviews,

      ...newPreviews,

    ]);

    setError("");

  };

  // ==========================================
  // HANDLE FILE INPUT
  // ==========================================
  const handleImageChange = (

    event: ChangeEvent<HTMLInputElement>

  ) => {

    const files = Array.from(

      event.target.files || []

    );

    handleImageFiles(files);

    // Allows selecting the same file again later.
    event.target.value = "";

  };

  // ==========================================
  // DRAG & DROP
  // ==========================================
  const handleDragOver = (

    event: DragEvent<HTMLDivElement>

  ) => {

    event.preventDefault();

    event.stopPropagation();

    setIsDragging(true);

  };

  const handleDragLeave = (

    event: DragEvent<HTMLDivElement>

  ) => {

    event.preventDefault();

    event.stopPropagation();

    setIsDragging(false);

  };

  const handleDrop = (

    event: DragEvent<HTMLDivElement>

  ) => {

    event.preventDefault();

    event.stopPropagation();

    setIsDragging(false);

    const files = Array.from(

      event.dataTransfer.files || []

    );

    handleImageFiles(files);

  };

  // ==========================================
  // REMOVE ALL IMAGES
  // ==========================================
  const handleRemoveImages = () => {

    imagePreviews.forEach((preview) => {

      URL.revokeObjectURL(preview);

    });

    setImages([]);

    setImagePreviews([]);

    setError("");

  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (

    event: FormEvent<HTMLFormElement>

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

    if (!form.media_type) {

      setError("Please select a media type.");

      return;

    }

    if (!form.category_id) {

      setError("Please select a category.");

      return;

    }

    if (form.price === "") {

      setError("Price is required.");

      return;

    }

    if (form.stock === "") {

      setError("Stock is required.");

      return;

    }

    if (images.length === 0) {

      setError(

        "Please upload at least one product image."

      );

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

        // Send all selected images.
        images,

      };

      await createProductMutation.mutateAsync(productData);

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

        <div className="mb-8">

          <button

            type="button"

            onClick={() =>

              navigate("/admin/products")

            }

            className="cursor-pointer mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"

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

        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            {error}

          </div>

        )}

        <form

          onSubmit={handleSubmit}

          className="space-y-6"

        >

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

                  <option value="">

                    {isLoadingMediaTypes ? "Loading media types..." : "Select media type"}

                  </option>

                  {mediaTypes.map((mediaType) => (

                    <option key={mediaType.id} value={mediaType.name}>

                      {mediaType.name}

                    </option>

                  ))}

                </select>

              </div>

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

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-6">

              <h2 className="text-lg font-bold text-gray-900">

                Product Images

              </h2>

              <p className="mt-1 text-sm text-gray-500">

                Upload up to 5 images for this product.

              </p>

            </div>

            <div

              onDragOver={handleDragOver}

              onDragLeave={handleDragLeave}

              onDrop={handleDrop}

              className={`rounded-xl border-2 border-dashed p-6 transition ${

                isDragging

                  ? "border-pink-400 bg-pink-50"

                  : "border-gray-200"

              }`}

            >

              {imagePreviews.length > 0 ? (

                <div className="space-y-5">

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

                    {imagePreviews.map(

                      (preview, index) => (

                        <div

                          key={preview}

                          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"

                        >

                          <img

                            src={preview}

                            alt={`Product image ${index + 1}`}

                            className="aspect-square w-full object-cover"

                          />

                          {index === 0 && (

                            <div className="absolute left-2 top-2 rounded-md bg-pink-500 px-2 py-1 text-xs font-semibold text-white">

                              Main Image

                            </div>

                          )}

                          <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">

                            Image {index + 1}

                          </div>

                        </div>

                      )

                    )}

                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-sm text-gray-500">

                      {images.length}{" "}

                      {images.length === 1

                        ? "image"

                        : "images"}{" "}

                      selected

                    </p>

                    <button

                      type="button"

                      onClick={handleRemoveImages}

                      className="cursor-pointer rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"

                    >

                      Remove All Images

                    </button>

                  </div>

                  {images.length < MAX_IMAGES && (

                    <div

                      className={`rounded-xl border-2 border-dashed p-6 text-center transition ${

                        isDragging

                          ? "border-pink-400 bg-pink-50"

                          : "border-gray-200"

                      }`}

                    >

                      <ImageIcon

                        size={24}

                        className="mx-auto mb-2 text-gray-400"

                      />

                      <p className="text-sm font-semibold text-gray-700">

                        {isDragging

                          ? "Drop images here"

                          : "Drag & drop more images"}

                      </p>

                      <p className="mt-1 text-xs text-gray-500">

                        or click the button below

                      </p>

                      <label

                        htmlFor="product-images"

                        className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"

                      >

                        Add Images

                        <input

                          id="product-images"

                          type="file"

                          accept="image/jpeg,image/png,image/webp"

                          multiple

                          onChange={handleImageChange}

                          className="hidden"

                        />

                      </label>

                      <p className="mt-3 text-xs text-gray-400">

                        {MAX_IMAGES - images.length}{" "}

                        {MAX_IMAGES - images.length === 1

                          ? "image"

                          : "images"}{" "}

                        remaining

                      </p>

                    </div>

                  )}

                </div>

              ) : (

                <label

                  htmlFor="product-images"

                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl py-10 text-center transition ${

                    isDragging

                      ? "bg-pink-50"

                      : ""

                  }`}

                >

                  <div className="mb-4 rounded-full bg-gray-100 p-4">

                    <ImageIcon

                      size={24}

                      className="text-gray-500"

                    />

                  </div>

                  <p className="text-sm font-semibold text-gray-900">

                    {isDragging

                      ? "Drop your images here"

                      : "Drag & drop images here"}

                  </p>

                  <p className="mt-1 text-sm text-gray-500">

                    or click to browse

                  </p>

                  <p className="mt-2 text-xs text-gray-500">

                    Up to 5 images · JPG, PNG, or WEBP · Maximum 5MB each

                  </p>

                  <input

                    id="product-images"

                    type="file"

                    accept="image/jpeg,image/png,image/webp"

                    multiple

                    onChange={handleImageChange}

                    className="hidden"

                  />

                </label>

              )}

            </div>

          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button

              type="button"

              onClick={() =>

                navigate("/admin/products")

              }

              disabled={isSaving}

              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"

            >

              Cancel

            </button>

            <button

              type="submit"

              disabled={

                isSaving ||

                isLoadingCategories ||

                isLoadingMediaTypes

              }

              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <Save size={17} />

              {isSaving

                ? "Creating..."

                : "Create Product"}

            </button>

          </div>

        </form>

      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-created-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
          >
            <button
              type="button"
              aria-label="Close success dialog"
              onClick={() => setShowSuccessModal(false)}
              className="cursor-pointer absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h2 id="product-created-title" className="mt-5 text-xl font-bold text-gray-900">
              Product added successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your new product has been added to the store inventory.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="cursor-pointer flex-1 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                View Products
              </button>
              <button
                type="button"
                onClick={() => {
                  imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
                  setImages([]);
                  setImagePreviews([]);
                  setForm({
                    name: "",
                    description: "",
                    media_type: "",
                    condition: "USED",
                    price: "",
                    stock: "",
                    category_id: "",
                    discount: "",
                  });
                  setError("");
                  setShowSuccessModal(false);
                }}
                className="cursor-pointer flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Add Another
              </button>
            </div>
          </section>
        </div>
      )}

    </main>

  );

};

export default AddProduct;
