import { useMemo, useState, type FormEvent, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Edit,
  Folder,
  Package,
  Plus,
  Settings,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Category = {
  id: string;
  name: string;
  created_at?: string | null;
};

type MediaType = {
  id: string;
  name: string;
  created_at?: string | null;
};

type ModalType = "CATEGORY" | "MEDIA_TYPE" | null;

const API_URL = import.meta.env.VITE_API_URL;

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [itemToDelete, setItemToDelete] = useState<{ type: "CATEGORY" | "MEDIA_TYPE"; item: Category | MediaType } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [name, setName] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchMediaType, setSearchMediaType] = useState("");

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }
    return session.access_token;
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["admin-settings", "categories"],
    queryFn: async (): Promise<Category[]> => {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");
      const response = await fetch(`${API_URL}/categories`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to load categories.");
      return result.data ?? [];
    },
  });

  const mediaTypesQuery = useQuery({
    queryKey: ["admin-settings", "media-types"],
    queryFn: async (): Promise<MediaType[]> => {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");
      const response = await fetch(`${API_URL}/media-types`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to load media types.");
      return result.data ?? [];
    },
  });

  const categories = categoriesQuery.data ?? [];
  const mediaTypes = mediaTypesQuery.data ?? [];
  const loadingCategories = categoriesQuery.isLoading || categoriesQuery.isFetching;
  const loadingMediaTypes = mediaTypesQuery.isLoading || mediaTypesQuery.isFetching;

  const filteredCategories = useMemo(() => {
    const query = searchCategory.trim().toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, searchCategory]);

  const filteredMediaTypes = useMemo(() => {
    const query = searchMediaType.trim().toLowerCase();
    return mediaTypes.filter((item) => item.name.toLowerCase().includes(query));
  }, [mediaTypes, searchMediaType]);

  const closeModal = () => {
    if (saving) return;
    setModalType(null);
    setEditingId(null);
    setName("");
  };

  const openAddModal = (type: ModalType) => {
    setError("");
    setSuccess("");
    setModalType(type);
    setEditingId(null);
    setName("");
  };

  const openEditCategory = (category: Category) => {
    setError("");
    setSuccess("");
    setModalType("CATEGORY");
    setEditingId(category.id);
    setName(category.name);
  };

  const openEditMediaType = (item: MediaType) => {
    setError("");
    setSuccess("");
    setModalType("MEDIA_TYPE");
    setEditingId(item.id);
    setName(item.name);
  };

  const saveCategory = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = await getAccessToken();
      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/categories/${encodeURIComponent(String(editingId))}`
        : `${API_URL}/categories`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to save category.");

      await queryClient.invalidateQueries({ queryKey: ["admin-settings", "categories"] });
      const message = result.message || (isEditing ? "Category updated." : "Category added.");
      setSuccess(message);
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin-settings", "categories"] });
      setModalType(null);
      setEditingId(null);
      setName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save category.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const saveMediaType = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = await getAccessToken();
      const isEditing = editingId !== null;
      const url = isEditing
        ? `${API_URL}/media-types/${encodeURIComponent(String(editingId))}`
        : `${API_URL}/media-types`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save media type.");
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-settings", "media-types"] });
      const message = result.message || (isEditing ? "Media type updated." : "Media type added.");
      setSuccess(message);
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin-settings", "media-types"] });
      setModalType(null);
      setEditingId(null);
      setName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save media type.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modalType === "CATEGORY") {
      await saveCategory();
    } else if (modalType === "MEDIA_TYPE") {
      await saveMediaType();
    }
  };

  const deleteCategoryRequest = async (category: Category) => {
    setError("");
    setSuccess("");
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_URL}/categories/${encodeURIComponent(category.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to delete category.");

      const message = result.message || "Category deleted successfully.";
      setSuccess(message);
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin-settings", "categories"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete category.";
      setError(message);
      toast.error(message);
    }
  };

  const deleteMediaTypeRequest = async (item: MediaType) => {
    setError("");
    setSuccess("");
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${API_URL}/media-types/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to delete media type.");

      const message = result.message || "Media type deleted successfully.";
      setSuccess(message);
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin-settings", "media-types"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete media type.";
      setError(message);
      toast.error(message);
    }
  };

  const handleDeleteCategory = (category: Category) =>
    setItemToDelete({ type: "CATEGORY", item: category });

  const handleDeleteMediaType = (item: MediaType) =>
    setItemToDelete({ type: "MEDIA_TYPE", item });

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { type, item } = itemToDelete;
    setItemToDelete(null);
    if (type === "CATEGORY") await deleteCategoryRequest(item as Category);
    else await deleteMediaTypeRequest(item as MediaType);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">Admin Panel</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="rounded-xl bg-gray-900 p-2.5">
              <Settings size={21} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Settings</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Manage your store catalog and configuration.
          </p>
        </div>

        {(error || success || categoriesQuery.isError || mediaTypesQuery.isError) && (
          <div className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
          }`}>
            {(error || categoriesQuery.isError || mediaTypesQuery.isError) ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <p>{error || success || (categoriesQuery.error instanceof Error ? categoriesQuery.error.message : mediaTypesQuery.error instanceof Error ? mediaTypesQuery.error.message : "")}</p>
            <button type="button" className="cursor-pointer ml-auto" onClick={() => { setError(""); setSuccess(""); }} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">Settings status</p>
          <p className="mt-1 text-xs leading-5 text-blue-700">
            Categories and media types are connected to the database. Store preferences are still demo-only.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage the categories and media types available when adding products.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3"><Folder size={21} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Categories</h3>
                    <p className="mt-1 text-xs text-gray-500">{categories.length} categories</p>
                  </div>
                </div>
                <button type="button" onClick={() => openAddModal("CATEGORY")} className="inline-flex shrink-0 items-center gap-1.5 cursor-pointer rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800">
                  <Plus size={15} /> Add
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <input type="text" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} placeholder="Search categories..." className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                <button type="button" onClick={() => void categoriesQuery.refetch()} disabled={loadingCategories} className="rounded-lg border border-gray-300 px-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" title="Refresh categories">
                  {loadingCategories ? <LoaderCircle size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingCategories ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500"><LoaderCircle size={18} className="animate-spin" /> Loading categories...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-8 text-center"><Folder size={30} className="mx-auto text-gray-300" /><p className="mt-3 text-sm text-gray-500">No categories found.</p></div>
              ) : filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100"><Folder size={17} className="text-gray-500" /></div>
                    <p className="truncate text-sm font-medium text-gray-800">{category.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEditCategory(category)} className="rounded-lg p-2 text-gray-400 transition cursor-pointer hover:bg-gray-100 hover:text-gray-900" title="Edit category"><Edit size={16} /></button>
                    <button type="button" onClick={() => void handleDeleteCategory(category)} className="rounded-lg p-2 text-gray-400 cursor-pointer transition hover:bg-red-50 hover:text-red-600" title="Delete category"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-3"><Package size={21} className="text-purple-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Media Types</h3>
                    <p className="mt-1 text-xs text-gray-500">{mediaTypes.length} media types</p>
                  </div>
                </div>
                <button type="button" onClick={() => openAddModal("MEDIA_TYPE")} className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800">
                  <Plus size={15} /> Add
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <input type="text" value={searchMediaType} onChange={(e) => setSearchMediaType(e.target.value)} placeholder="Search media types..." className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                <button type="button" onClick={() => void mediaTypesQuery.refetch()} disabled={loadingMediaTypes} className="rounded-lg border border-gray-300 px-3 text-gray-600 hover:bg-gray-50 disabled:opacity-50" title="Refresh media types">
                  {loadingMediaTypes ? <LoaderCircle size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {loadingMediaTypes ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500"><LoaderCircle size={18} className="animate-spin" /> Loading media types...</div>
              ) : filteredMediaTypes.length === 0 ? (
                <div className="p-8 text-center"><Package size={30} className="mx-auto text-gray-300" /><p className="mt-3 text-sm text-gray-500">No media types found.</p></div>
              ) : filteredMediaTypes.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100"><Package size={17} className="text-gray-500" /></div>
                    <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEditMediaType(item)} className="rounded-lg p-2 text-gray-400 cursor-pointer transition hover:bg-gray-100 hover:text-gray-900" title="Edit media type"><Edit size={16} /></button>
                    <button type="button" onClick={() => void handleDeleteMediaType(item)} className="rounded-lg p-2 text-gray-400 cursor-pointer transition hover:bg-red-50 hover:text-red-600" title="Delete media type"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
              Media types are saved to the database. Existing products still store their media type as text.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-gray-900">Store Preferences</h2>
            <p className="mt-1 text-sm text-gray-500">Additional store configuration.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-800">Currency</p>
              <p className="mt-1 text-sm text-gray-500">Philippine Peso (₱)</p>
              <span className="mt-3 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Demo</span>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-800">Store Pickup</p>
              <p className="mt-1 text-sm text-gray-500">Available in Pasay</p>
              <span className="mt-3 inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Enabled</span>
            </div>
          </div>
        </section>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingId !== null ? `Edit ${modalType === "CATEGORY" ? "Category" : "Media Type"}` : `Add ${modalType === "CATEGORY" ? "Category" : "Media Type"}`}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Changes will be saved to the database.
                </p>
              </div>
              <button type="button" onClick={closeModal} className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="p-5">
                <label htmlFor="setting-name" className="mb-2 block text-sm font-medium text-gray-700">
                  {modalType === "CATEGORY" ? "Category Name" : "Media Type Name"}
                </label>
                <input id="setting-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={100} placeholder={modalType === "CATEGORY" ? "e.g. Books & Magazines" : "e.g. Blu-ray"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                <button type="button" onClick={closeModal} disabled={saving} className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={!name.trim() || saving} className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving ? "Saving..." : editingId !== null ? "Save Changes" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-setting-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-setting-title" className="mt-4 text-lg font-semibold text-gray-900">Delete {itemToDelete.type === "CATEGORY" ? "category" : "media type"}?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Are you sure you want to delete <strong>{itemToDelete.item.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setItemToDelete(null)} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void confirmDelete()} className="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;