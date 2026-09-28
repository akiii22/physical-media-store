import { useMemo, useState } from "react";
import {
  Edit,
  Folder,
  Package,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
};

type MediaType = {
  id: number;
  name: string;
};

type ModalType = "CATEGORY" | "MEDIA_TYPE" | null;

const initialCategories: Category[] = [
  { id: 1, name: "Music" },
  { id: 2, name: "Movies" },
  { id: 3, name: "Filipino" },
  { id: 4, name: "International" },
  { id: 5, name: "Other" },
];

const initialMediaTypes: MediaType[] = [
  { id: 1, name: "CD" },
  { id: 2, name: "Cassette" },
  { id: 3, name: "Vinyl" },
  { id: 4, name: "VCD" },
  { id: 5, name: "DVD" },
  { id: 6, name: "Other" },
];

const AdminSettings = () => {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [mediaTypes, setMediaTypes] =
    useState<MediaType[]>(initialMediaTypes);

  const [modalType, setModalType] =
    useState<ModalType>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState("");

  const [searchCategory, setSearchCategory] =
    useState("");

  const [searchMediaType, setSearchMediaType] =
    useState("");

  // =========================================================
  // FILTER CATEGORIES
  // =========================================================

  const filteredCategories = useMemo(() => {
    return categories.filter((category) =>
      category.name
        .toLowerCase()
        .includes(searchCategory.toLowerCase())
    );
  }, [categories, searchCategory]);

  // =========================================================
  // FILTER MEDIA TYPES
  // =========================================================

  const filteredMediaTypes = useMemo(() => {
    return mediaTypes.filter((mediaType) =>
      mediaType.name
        .toLowerCase()
        .includes(searchMediaType.toLowerCase())
    );
  }, [mediaTypes, searchMediaType]);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = (type: ModalType) => {
    setModalType(type);
    setEditingId(null);
    setName("");
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditCategory = (category: Category) => {
    setModalType("CATEGORY");
    setEditingId(category.id);
    setName(category.name);
  };

  const openEditMediaType = (mediaType: MediaType) => {
    setModalType("MEDIA_TYPE");
    setEditingId(mediaType.id);
    setName(mediaType.name);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setName("");
  };

  // =========================================================
  // SAVE CATEGORY
  // =========================================================

  const handleSaveCategory = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    if (editingId !== null) {
      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingId
            ? {
                ...category,
                name: trimmedName,
              }
            : category
        )
      );
    } else {
      const newCategory: Category = {
        id: Date.now(),
        name: trimmedName,
      };

      setCategories((previous) => [
        ...previous,
        newCategory,
      ]);
    }

    closeModal();
  };

  // =========================================================
  // SAVE MEDIA TYPE
  // =========================================================

  const handleSaveMediaType = () => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    if (editingId !== null) {
      setMediaTypes((previous) =>
        previous.map((mediaType) =>
          mediaType.id === editingId
            ? {
                ...mediaType,
                name: trimmedName,
              }
            : mediaType
        )
      );
    } else {
      const newMediaType: MediaType = {
        id: Date.now(),
        name: trimmedName,
      };

      setMediaTypes((previous) => [
        ...previous,
        newMediaType,
      ]);
    }

    closeModal();
  };

  // =========================================================
  // SUBMIT MODAL
  // =========================================================

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (modalType === "CATEGORY") {
      handleSaveCategory();
      return;
    }

    if (modalType === "MEDIA_TYPE") {
      handleSaveMediaType();
    }
  };

  // =========================================================
  // DELETE CATEGORY
  // =========================================================

  const handleDeleteCategory = (id: number) => {
    const category = categories.find(
      (item) => item.id === id
    );

    if (!category) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  // =========================================================
  // DELETE MEDIA TYPE
  // =========================================================

  const handleDeleteMediaType = (id: number) => {
    const mediaType = mediaTypes.find(
      (item) => item.id === id
    );

    if (!mediaType) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${mediaType.name}"?`
    );

    if (!confirmed) return;

    setMediaTypes((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Admin Panel
          </p>

          <div className="mt-1 flex items-center gap-3">
            <div className="rounded-xl bg-gray-900 p-2.5">
              <Settings
                size={21}
                className="text-white"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Settings
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Manage your store catalog and configuration.
          </p>
        </div>

        {/* =================================================
            DEMO NOTICE
        ================================================= */}

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            Demo Settings
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Category and media type changes are currently
            stored only in this page for demonstration.
            They are not connected to the database yet.
          </p>
        </div>

        {/* =================================================
            CATALOG SECTION
        ================================================= */}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Product Catalog
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage the categories and media types available
            when adding products.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Header */}
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <Folder
                      size={21}
                      className="text-blue-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Categories
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {categories.length} categories
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openAddModal("CATEGORY")
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
                >
                  <Plus size={15} />
                  Add
                </button>

              </div>

              {/* Search */}
              <div className="mt-4">
                <input
                  type="text"
                  value={searchCategory}
                  onChange={(e) =>
                    setSearchCategory(e.target.value)
                  }
                  placeholder="Search categories..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100">

              {filteredCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <Folder
                    size={30}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    No categories found.
                  </p>
                </div>
              ) : (
                filteredCategories.map(
                  (category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <Folder
                            size={17}
                            className="text-gray-500"
                          />
                        </div>

                        <p className="truncate text-sm font-medium text-gray-800">
                          {category.name}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            openEditCategory(
                              category
                            )
                          }
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          title="Edit category"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCategory(
                              category.id
                            )
                          }
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </div>
                  )
                )
              )}

            </div>
          </section>

          {/* =================================================
              MEDIA TYPES
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Header */}
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-3">
                    <Package
                      size={21}
                      className="text-purple-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Media Types
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {mediaTypes.length} media types
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openAddModal("MEDIA_TYPE")
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
                >
                  <Plus size={15} />
                  Add
                </button>

              </div>

              {/* Search */}
              <div className="mt-4">
                <input
                  type="text"
                  value={searchMediaType}
                  onChange={(e) =>
                    setSearchMediaType(e.target.value)
                  }
                  placeholder="Search media types..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-100">

              {filteredMediaTypes.length === 0 ? (
                <div className="p-8 text-center">
                  <Package
                    size={30}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    No media types found.
                  </p>
                </div>
              ) : (
                filteredMediaTypes.map(
                  (mediaType) => (
                    <div
                      key={mediaType.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <Package
                            size={17}
                            className="text-gray-500"
                          />
                        </div>

                        <p className="truncate text-sm font-medium text-gray-800">
                          {mediaType.name}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            openEditMediaType(
                              mediaType
                            )
                          }
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                          title="Edit media type"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMediaType(
                              mediaType.id
                            )
                          }
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete media type"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </div>
                  )
                )
              )}

            </div>
          </section>
        </div>

        {/* =================================================
            STORE PREFERENCES
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">
              Store Preferences
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Additional store configuration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-800">
                Currency
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Philippine Peso (₱)
              </p>

              <span className="mt-3 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Demo
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-800">
                Store Pickup
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Available in Pasay
              </p>

              <span className="mt-3 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Enabled
              </span>
            </div>

          </div>
        </section>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5">

              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingId !== null
                    ? `Edit ${
                        modalType === "CATEGORY"
                          ? "Category"
                          : "Media Type"
                      }`
                    : `Add ${
                        modalType === "CATEGORY"
                          ? "Category"
                          : "Media Type"
                      }`}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {modalType === "CATEGORY"
                    ? "Manage product category."
                    : "Manage product media type."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>

            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>

              <div className="p-5">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {modalType === "CATEGORY"
                    ? "Category Name"
                    : "Media Type Name"}
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoFocus
                  placeholder={
                    modalType === "CATEGORY"
                      ? "e.g. K-Pop"
                      : "e.g. Blu-ray"
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />

                <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-5 text-gray-500">
                  Changes are currently for the demo UI
                  only and are not saved to the database.
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 p-5">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingId !== null
                    ? "Save Changes"
                    : "Add"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;