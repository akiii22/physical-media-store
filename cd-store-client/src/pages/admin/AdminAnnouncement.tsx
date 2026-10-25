
import { useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  type Announcement,
  type AnnouncementInput,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementImage,
} from "../../services/announcementService";

const emptyForm: AnnouncementInput = {
  title: "",
  heading: "",
  description: "",
  image_url: "",
  is_active: false,
  start_at: "",
  end_at: "",
  sort_order: 0,
};

const toLocalDateTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const toISOStringOrEmpty = (value: string) =>
  value ? new Date(value).toISOString() : "";

const AdminAnnouncements = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementInput>({
    ...emptyForm,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
const previewUrlRef = useRef<string | null>(null);
  // Clean up temporary browser preview URLs.
const clearImagePreview = () => {
  if (previewUrlRef.current) {
    URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }
};
  const announcementsQuery = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: getAnnouncements,
  });

  const closeForm = () => {
    clearImagePreview()
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = form.image_url;

      // Upload a newly selected image before saving the announcement.
      if (selectedImage) {
        imageUrl = await uploadAnnouncementImage(selectedImage);
      }

      const payload: AnnouncementInput = {
        ...form,
        image_url: imageUrl,
        start_at: toISOStringOrEmpty(form.start_at),
        end_at: toISOStringOrEmpty(form.end_at),
      };

      return editingId
        ? updateAnnouncement(editingId, payload)
        : createAnnouncement(payload);
    },

    onSuccess: async () => {
      toast.success(
        editingId
          ? "Announcement updated successfully."
          : "Announcement created successfully.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-announcements"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["store-announcements"],
        }),
      ]);

      closeForm();
    },

    onError: (error: Error) => {
      toast.error(error.message || "Unable to save announcement.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,

    onSuccess: async () => {
      toast.success("Announcement deleted.");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-announcements"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["store-announcements"],
        }),
      ]);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Unable to delete announcement.");
    },
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview("");
    setFormOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditForm = (announcement: Announcement) => {
    setEditingId(announcement.id);

    setForm({
      title: announcement.title,
      heading: announcement.heading,
      description: announcement.description ?? "",
      image_url: announcement.image_url ?? "",
      is_active: announcement.is_active,
      start_at: toLocalDateTime(announcement.start_at),
      end_at: toLocalDateTime(announcement.end_at),
      sort_order: announcement.sort_order,
    });

    setSelectedImage(null);
    setImagePreview(announcement.image_url ?? "");
    setFormOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setField = <K extends keyof AnnouncementInput>(
    field: K,
    value: AnnouncementInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    clearImagePreview(); // Clean up any previous object URL

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);

    // Create a local preview URL and update state
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImagePreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setField("image_url", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.heading.trim()) {
      toast.error("Title and heading are required.");
      return;
    }

    if (
      form.start_at &&
      form.end_at &&
      new Date(form.end_at).getTime() <=
        new Date(form.start_at).getTime()
    ) {
      toast.error("The end date must be later than the start date.");
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = (announcement: Announcement) => {
    if (
      !window.confirm(
        `Delete "${announcement.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    deleteMutation.mutate(announcement.id);
  };

  const announcements = announcementsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Store Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Announcements
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage promotional slides displayed on your storefront.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Create announcement
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total announcements
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {announcements.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {announcements.filter((item) => item.is_active).length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="mt-2 text-3xl font-bold text-gray-500">
              {announcements.filter((item) => !item.is_active).length}
            </p>
          </div>
        </div>

        {/* Create and edit form */}
        {formOpen && (
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Edit announcement" : "New announcement"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add the content, image, and schedule for this slide.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Internal title */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Internal title *
                  </span>
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(event) =>
                      setField("title", event.target.value)
                    }
                    placeholder="e.g. Holiday Sale"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </label>

                {/* Display heading */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Display heading *
                  </span>
                  <input
                    required
                    maxLength={180}
                    value={form.heading}
                    onChange={(event) =>
                      setField("heading", event.target.value)
                    }
                    placeholder="e.g. Find your next favorite record"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </label>

                {/* Description */}
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Description
                  </span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.description}
                    onChange={(event) =>
                      setField("description", event.target.value)
                    }
                    placeholder="Describe the promotion or announcement..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </label>

                {/* Image upload */}
                <div className="md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Announcement image
                  </span>

                  <div className="rounded-xl border border-dashed border-gray-300 p-4 sm:p-5">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <div className="overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={imagePreview}
                            alt="Announcement preview"
                            className="max-h-72 w-full object-contain"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-gray-500">
                            {selectedImage
                              ? selectedImage.name
                              : "Current announcement image"}
                          </p>

                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                            Remove image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 text-center">
                        <ImageIcon
                          size={36}
                          className="mx-auto text-gray-400"
                        />
                        <p className="mt-3 text-sm font-medium text-gray-700">
                          Upload an announcement image
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          JPEG, PNG, or WebP · Maximum 5 MB
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      id="announcement-image"
                    />

                    <label
                      htmlFor="announcement-image"
                      className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Upload size={16} />
                      {imagePreview ? "Choose another image" : "Choose image"}
                    </label>
                  </div>
                </div>

                {/* Schedule start */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Start date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      setField("start_at", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Leave blank to start immediately.
                  </span>
                </label>

                {/* Schedule end */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    End date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      setField("end_at", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Leave blank for no scheduled end.
                  </span>
                </label>

                {/* Display order */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Display order
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.sort_order}
                    onChange={(event) =>
                      setField(
                        "sort_order",
                        Math.max(0, Math.floor(Number(event.target.value) || 0)),
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Lower numbers appear first.
                  </span>
                </label>

                {/* Active toggle */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setField("is_active", event.target.checked)
                    }
                    className="h-4 w-4 accent-gray-950"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Activate announcement
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Only active announcements within their schedule appear.
                    </span>
                  </span>
                </label>
              </div>

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveMutation.isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {saveMutation.isPending
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create announcement"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Announcement list */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900">
              All announcements
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage the slides available to your storefront.
            </p>
          </div>

          {announcementsQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
              <LoaderCircle size={18} className="animate-spin" />
              Loading announcements...
            </div>
          ) : announcementsQuery.isError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">
                {announcementsQuery.error.message}
              </p>
              <button
                type="button"
                onClick={() => announcementsQuery.refetch()}
                className="mt-3 text-sm font-semibold text-gray-900 underline"
              >
                Try again
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone
                size={36}
                className="mx-auto text-gray-300"
              />
              <h3 className="mt-4 font-semibold text-gray-900">
                No announcements yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first slide to promote something in your store.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 cursor-pointer rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Create announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:w-36">
                    {announcement.image_url ? (
                      <img
                        src={announcement.image_url}
                        alt={announcement.heading}
                        className="h-full w-full object-cover"
                         onError={() => {
    console.error(
      "Announcement image failed:",
      announcement.image_url,
    );
  }}
                      />
                    ) : (
                      <ImageIcon
                        size={28}
                        className="text-gray-400"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {announcement.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          announcement.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {announcement.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-gray-700">
                      {announcement.heading}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {announcement.description || "No description provided."}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      Display order: {announcement.sort_order}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => openEditForm(announcement)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={
                        deleteMutation.isPending &&
                        deleteMutation.variables === announcement.id
                      }
                      onClick={() => handleDelete(announcement)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
