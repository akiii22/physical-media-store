
import { useEffect, useState } from "react";
import { Save, RefreshCw, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

type EmailTemplate = {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
};

const AdminEmailTemplate = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedTemplate = templates.find(
    (template) => template.id === selectedId
  );

  const getToken = async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return session.access_token;
  };

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/admin/email-templates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load email templates."
        );
      }

      const loadedTemplates: EmailTemplate[] = result.data ?? [];

      setTemplates(loadedTemplates);

      if (loadedTemplates.length > 0) {
        const firstTemplate = loadedTemplates[0];

        setSelectedId(firstTemplate.id);
        setSubject(firstTemplate.subject);
        setBody(firstTemplate.body);
        setIsActive(firstTemplate.is_active);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load email templates."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleSelectTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id);

    if (!template) return;

    setSelectedId(template.id);
    setSubject(template.subject);
    setBody(template.body);
    setIsActive(template.is_active);
    setError("");
    setMessage("");
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/admin/email-templates/${selectedTemplate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            body,
            is_active: isActive,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save email template."
        );
      }

      const updatedTemplate: EmailTemplate = result.data;

      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id
            ? updatedTemplate
            : template
        )
      );

      setSubject(updatedTemplate.subject);
      setBody(updatedTemplate.body);
      setIsActive(updatedTemplate.is_active);

      setMessage("Email template saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save email template."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading email templates...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Email Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the messages sent to your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTemplates()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <Mail className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="font-medium">No email templates found.</p>
          <p className="mt-1 text-sm text-gray-500">
            Check your email_templates table in Supabase.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl border bg-white p-3">
            <h2 className="mb-3 px-2 text-sm font-semibold text-gray-500">
              AVAILABLE TEMPLATES
            </h2>

            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() =>
                    handleSelectTemplate(template.id)
                  }
                  className={`w-full rounded-lg px-3 py-3 text-left text-sm ${
                    selectedId === template.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="block font-medium">
                    {template.name}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${
                      selectedId === template.id
                        ? "text-gray-300"
                        : "text-gray-500"
                    }`}
                  >
                    {template.template_key}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5 rounded-xl border bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedTemplate?.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Changes are saved to your database.
              </p>
            </div>

            <div>
              <label
                htmlFor="email-subject"
                className="mb-2 block text-sm font-medium"
              >
                Email subject
              </label>
              <input
                id="email-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-gray-500"
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <label
                htmlFor="email-body"
                className="mb-2 block text-sm font-medium"
              >
                Email message
              </label>
              <textarea
                id="email-body"
                value={body}
                onChange={(event) =>
                  setBody(event.target.value)
                }
                rows={14}
                className="w-full rounded-lg border px-3 py-3 font-mono text-sm outline-none focus:border-gray-500"
                placeholder="Write your email message..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Available placeholders depend on the template, such as{" "}
                {"{{customerName}}"}, {"{{orderId}}"},{" "}
                {"{{totalAmount}}"}, and {"{{storeName}}"}.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                className="h-4 w-4"
              />
              Template is active
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !subject.trim() || !body.trim()}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplate;
