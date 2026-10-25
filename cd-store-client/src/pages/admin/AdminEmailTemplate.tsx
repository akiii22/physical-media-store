import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Mail, Monitor, RefreshCw, Save, Smartphone } from "lucide-react";
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

const SAMPLE_VALUES: Record<string, string> = {
  customerName: "Alex",
  orderId: "CDS-1042",
  totalAmount: "₱1,250.00",
  deliveryFee: "₱120.00",
  paymentMethod: "GCASH",
  paymentDetails: "Please follow the payment instructions provided by CDs Atbp.",
  storeName: "CDs Atbp.",
  rejectionReason: "The payment receipt could not be verified. Please contact us for assistance.",
};

const PLACEHOLDERS = [
  "{{customerName}}",
  "{{orderId}}",
  "{{totalAmount}}",
  "{{deliveryFee}}",
  "{{paymentMethod}}",
  "{{paymentDetails}}",
  "{{storeName}}",
  "{{rejectionReason}}",
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function previewText(template: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => {
    return SAMPLE_VALUES[key] ?? placeholder;
  });
}

function buildPreviewHtml(subject: string, body: string): string {
  const safeSubject = escapeHtml(previewText(subject));
  const safeBody = escapeHtml(previewText(body)).replace(/\r?\n/g, "<br />");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeSubject}</title>
</head>
<body style="margin:0;background:#f4f0e9;font-family:Arial,Helvetica,sans-serif;color:#292722;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">An update from CDs Atbp.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e8e1d6;">
        <tr><td style="background:#25241f;padding:28px 30px;text-align:center;color:#f9f5ed;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d7b49a;">CURATED MUSIC & PHYSICAL MEDIA</div>
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:bold;letter-spacing:.5px;margin-top:8px;">CDs Atbp.</div>
          <div style="font-size:12px;color:#d9d5cd;margin-top:7px;">Records, memories, and everything in between.</div>
        </td></tr>
        <tr><td style="padding:30px 30px 34px;">
          <div style="font-size:11px;letter-spacing:1.8px;color:#a45f3d;text-transform:uppercase;font-weight:bold;">A NOTE FROM OUR STORE</div>
          <h1 style="font-family:Georgia,serif;font-size:24px;line-height:1.35;font-weight:normal;margin:10px 0 22px;color:#292722;">${safeSubject || "Your message from CDs Atbp."}</h1>
          <div style="font-size:15px;line-height:1.85;color:#4b4942;overflow-wrap:anywhere;">${safeBody || "Your email message will appear here."}</div>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee7dc;font-size:13px;line-height:1.7;color:#6f6a60;">Thank you for choosing CDs Atbp. If you have questions, please reply to this email or contact our store.</div>
        </td></tr>
        <tr><td style="background:#f9f6f0;padding:20px 28px;text-align:center;font-size:11px;line-height:1.7;color:#777167;">CDs Atbp. · Made for music lovers<br />This is an automated transactional message about your order.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const selectedTemplate = templates.find((template) => template.id === selectedId);

  const previewHtml = useMemo(
    () => buildPreviewHtml(subject, body),
    [subject, body]
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
      const response = await fetch(`${API_URL}/admin/email-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load email templates.");
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
      setError(err instanceof Error ? err.message : "Failed to load email templates.");
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

  const insertPlaceholder = (placeholder: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setBody((current) => `${current}${current ? " " : ""}${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${body.slice(0, start)}${placeholder}${body.slice(end)}`;
    setBody(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + placeholder.length;
      textarea.setSelectionRange(cursor, cursor);
    });
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
          body: JSON.stringify({ subject, body, is_active: isActive }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save email template.");
      }

      const updatedTemplate: EmailTemplate = result.data;
      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template
        )
      );
      setSubject(updatedTemplate.subject);
      setBody(updatedTemplate.body);
      setIsActive(updatedTemplate.is_active);
      setMessage("Email template saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save email template.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Loading email templates...</div>;
  }

  return (
    <div className="min-h-screen space-y-6 bg-stone-50 p-4 text-stone-900 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
            <Mail size={14} /> STORE COMMUNICATIONS
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Email templates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Write customer emails, preview the CDs Atbp. look, and save changes to your store.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTemplates()}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-100"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <Mail className="mx-auto mb-3 text-stone-400" size={32} />
          <p className="font-semibold">No email templates found</p>
          <p className="mt-1 text-sm text-stone-500">Check the email_templates table in Supabase.</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
            <div className="px-3 pb-3 pt-2 text-xs font-semibold tracking-widest text-stone-400">AVAILABLE TEMPLATES</div>
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selectedId === template.id
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{template.name}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${template.is_active ? "bg-emerald-500" : "bg-stone-300"}`} />
                  </span>
                  <span className={`mt-1 block text-xs ${selectedId === template.id ? "text-stone-300" : "text-stone-400"}`}>
                    {template.template_key}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-500">
              <span className="font-semibold text-stone-700">Tip</span>
              <p className="mt-1">Keep order IDs and payment amounts in the message so customers can quickly identify their order.</p>
            </div>
          </aside>

          <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
            <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selectedTemplate?.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">Edit the message content below.</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="email-subject" className="mb-2 block text-sm font-semibold">Email subject</label>
                  <input
                    id="email-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-100"
                    placeholder="e.g. Payment instructions for order {{orderId}}"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="email-body" className="block text-sm font-semibold">Email message</label>
                    <span className="text-xs text-stone-400">Plain text with placeholders</span>
                  </div>
                  <textarea
                    ref={bodyRef}
                    id="email-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={12}
                    className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3.5 py-3 font-mono text-sm leading-6 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-100"
                    placeholder={"Hi {{customerName}},\n\nThank you for shopping with {{storeName}}!"}
                  />
                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    Placeholders are replaced with order details when the email is sent. The preview uses sample values.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Insert placeholder</p>
                  <div className="flex flex-wrap gap-2">
                    {PLACEHOLDERS.map((placeholder) => (
                      <button
                        key={placeholder}
                        type="button"
                        onClick={() => insertPlaceholder(placeholder)}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-mono text-xs text-stone-600 hover:border-stone-400 hover:bg-white"
                      >
                        {placeholder}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="h-4 w-4 accent-stone-900"
                  />
                  <span>
                    <span className="block text-sm font-medium">Template is active</span>
                    <span className="block text-xs text-stone-500">Inactive templates will not be used by the email service.</span>
                  </span>
                </label>

                <div className="flex justify-end border-t border-stone-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving || !subject.trim() || !body.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} /> {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-4">
                <div className="flex items-center gap-2">
                  <Eye size={17} className="text-stone-500" />
                  <div>
                    <h2 className="text-sm font-semibold">Live email preview</h2>
                    <p className="text-xs text-stone-500">Sample data · layout preview</p>
                  </div>
                </div>
                <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    aria-pressed={previewMode === "desktop"}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${previewMode === "desktop" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                  >
                    <Monitor size={14} /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    aria-pressed={previewMode === "mobile"}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${previewMode === "mobile" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                </div>
              </div>
              <div className="min-w-0 overflow-x-auto bg-stone-100 p-3 sm:p-5">
                <div className={`mx-auto overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-all ${previewMode === "mobile" ? "w-[320px] max-w-full" : "w-full max-w-[600px]"}`}>
                  <iframe
                    title="CDs Atbp. email preview"
                    srcDoc={previewHtml}
                    sandbox=""
                    className="block h-[650px] w-full border-0 bg-white"
                  />
                </div>
              </div>
              <div className="border-t border-stone-200 px-4 py-3 text-xs leading-5 text-stone-500">
                This is a visual preview only. Test by sending an actual email before using it with customers.
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplate;
