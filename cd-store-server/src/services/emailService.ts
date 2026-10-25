import { Resend } from "resend";
import { supabase } from "../config/supabase";
import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing from environment variables.");
}

const resend = new Resend(apiKey);
const emailFrom = process.env.EMAIL_FROM || "CDs Atbp. <onboarding@resend.dev>";
const STORE_NAME = "CDs Atbp.";

type PaymentInstructionsEmail = {
  to: string;
  customerName: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
};

type DeliveryPaymentInstructionsEmail = {
  to: string;
  customerName: string;
  orderId: string;
  deliveryFee: number;
  paymentMethod: string;
};

type PaymentDecisionEmail = {
  to: string;
  customerName: string;
  orderId: string;
  storeName?: string;
};

type EmailTemplate = {
  subject: string;
  body: string;
};

type InlineQrAttachment = {
  filename: string;
  content: string;
  contentId: string;
};

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

function replacePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => {
    return values[key] ?? placeholder;
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function normalizePaymentMethod(method: string): string {
  return method.trim().toUpperCase();
}

function getPaymentDetails(method: string): string {
  switch (normalizePaymentMethod(method)) {
    case "GCASH":
      return `GCash number: ${
        process.env.PAYMENT_GCASH_NUMBER ||
        "Please refer to the payment QR or contact the store."
      }`;
    case "MAYA":
      return `Maya number: ${
        process.env.PAYMENT_MAYA_NUMBER ||
        "Please refer to the payment QR or contact the store."
      }`;
    case "CARD":
      return (
        "Please follow the card payment instructions provided " +
        "by the store's configured payment provider."
      );
    default:
      return "Please contact the store for payment instructions.";
  }
}

/**
 * Loads a local demo QR and prepares it as an inline email attachment.
 * Demo images are deliberately disabled in production.
 */
function getPaymentQrAttachment(method: string): InlineQrAttachment | null {
  const normalizedMethod = normalizePaymentMethod(method);
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PAYMENT_QR_MODE !== "demo"
  ) {
    return null;
  }

  let configuredPath: string | undefined;
  switch (normalizedMethod) {
    case "GCASH":
      configuredPath = process.env.PAYMENT_GCASH_QR_PATH;
      break;
    case "MAYA":
      configuredPath = process.env.PAYMENT_MAYA_QR_PATH;
      break;
    default:
      // Card payments must never display an e-wallet QR.
      return null;
  }

  if (!configuredPath) {
    console.warn(`[Email] No demo QR path configured for ${normalizedMethod}.`);
    return null;
  }

  const qrPath = path.resolve(process.cwd(), configuredPath);
  if (!fs.existsSync(qrPath)) {
    console.error(`[Email] QR image not found: ${qrPath}`);
    return null;
  }

  const contentId = `demo-${normalizedMethod.toLowerCase()}-qr`;
  return {
    filename: `demo-${normalizedMethod.toLowerCase()}-qr.png`,
    content: fs.readFileSync(qrPath).toString("base64"),
    contentId,
  };
}

function renderPaymentQr(
  method: string,
  attachment: InlineQrAttachment | null
): string {
  const normalizedMethod = normalizePaymentMethod(method);
  if (normalizedMethod !== "GCASH" && normalizedMethod !== "MAYA") {
    return "";
  }
  if (!attachment) {
    return `
      <div style="margin:24px 0;padding:16px;border:1px dashed #d1d5db;border-radius:12px;text-align:center;color:#6b7280;">
        <strong>Payment QR unavailable</strong>
        <p style="margin-bottom:0;">Please contact the store for verified payment instructions.</p>
      </div>
    `;
  }

  return `
    <div style="margin:24px 0;text-align:center;">
      <p style="font-weight:bold;">Scan to pay using ${escapeHtml(normalizedMethod)}</p>
      <p style="color:#b45309;font-weight:bold;border:1px solid #f59e0b;padding:8px;">
        DEMO ONLY — DO NOT USE FOR PAYMENT
      </p>
      <img
        src="cid:${escapeHtml(attachment.contentId)}"
        alt="${escapeHtml(normalizedMethod)} demo QR code"
        width="220"
        style="display:block;width:220px;max-width:100%;height:auto;margin:0 auto;"
      />
      <p style="font-size:12px;color:#6b7280;">This is a test image, not a valid payment QR.</p>
    </div>
  `;
}

async function loadEmailTemplate(templateKey: string): Promise<EmailTemplate> {
  const { data: template, error } = await supabase
    .from("email_templates")
    .select("subject, body")
    .eq("template_key", templateKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(`[Email] Failed to load template "${templateKey}":`, error);
    throw new Error(`Unable to load the "${templateKey}" email template.`);
  }

  if (!template) {
    throw new Error(`The "${templateKey}" template is missing or inactive.`);
  }

  return template as EmailTemplate;
}

function renderPlainTextMessage(message: string): string {
  return escapeHtml(message).replace(/\r?\n/g, "<br />");
}

function renderBrandedEmail(content: string, subject: string): string {
  const safeSubject = escapeHtml(subject);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeSubject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f0e9;font-family:Arial,Helvetica,sans-serif;color:#292722;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">An update from ${escapeHtml(STORE_NAME)}.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f0e9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e1d6;">
        <tr><td align="center" style="background:#25241f;padding:28px 24px;color:#f9f5ed;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d7b49a;">Curated music &amp; physical media</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;margin-top:8px;">${escapeHtml(STORE_NAME)}</div>
          <div style="font-size:12px;color:#d9d5cd;margin-top:7px;">Records, memories, and everything in between.</div>
        </td></tr>
        <tr><td style="padding:30px 28px 34px;">
          <div style="font-size:11px;letter-spacing:1.8px;color:#a45f3d;text-transform:uppercase;font-weight:bold;">A note from our store</div>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.35;font-weight:normal;margin:10px 0 22px;color:#292722;">${safeSubject}</h1>
          <div style="font-size:15px;line-height:1.85;color:#4b4942;overflow-wrap:anywhere;">${content}</div>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee7dc;font-size:13px;line-height:1.7;color:#6f6a60;">Thank you for choosing ${escapeHtml(STORE_NAME)}. If you have questions, please reply to this email or contact our store.</div>
        </td></tr>
        <tr><td align="center" style="background:#f9f6f0;padding:20px 24px;font-size:11px;line-height:1.7;color:#777167;">${escapeHtml(STORE_NAME)} · Made for music lovers<br>Automated transactional message about your order.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendHtmlEmail({
  to,
  subject,
  html,
  orderId,
  templateKey,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  orderId: string;
  templateKey: string;
  attachments?: InlineQrAttachment[];
}) {
  console.log("[Email] Submitting email to Resend:", {
    recipient: to,
    orderId,
    templateKey,
    hasInlineQr: Boolean(attachments?.length),
  });

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: [to],
    subject,
    html: renderBrandedEmail(html, subject),
    ...(attachments?.length ? { attachments } : {}),
  });

  if (error) {
    console.error("[Email] Resend rejected the request:", {
      message: error.message,
      orderId,
      templateKey,
    });
    throw new Error(error.message);
  }

  console.log("[Email] Resend accepted the request:", {
    orderId,
    templateKey,
    emailId: data?.id,
  });
  return data;
}

function validatePaymentAmount(amount: number, description: string): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid ${description} amount for payment email.`);
  }
}

export async function sendPaymentInstructionsEmail({
  to,
  customerName,
  orderId,
  totalAmount,
  paymentMethod,
}: PaymentInstructionsEmail) {
  console.log(`[Email] Loading product payment template for order ${orderId}`);
  validatePaymentAmount(totalAmount, "product payment");

  const method = normalizePaymentMethod(paymentMethod);
  const template = await loadEmailTemplate("payment_instructions");
  const values: Record<string, string> = {
    customerName,
    orderId,
    totalAmount: formatCurrency(totalAmount),
    paymentMethod: method,
    storeName: STORE_NAME,
    paymentDetails: getPaymentDetails(method),
  };

  const subject = replacePlaceholders(template.subject, values);
  const message = replacePlaceholders(template.body, values);
  const htmlBody = renderPlainTextMessage(message);
  const qrAttachment = getPaymentQrAttachment(method);
  const paymentQrHtml = renderPaymentQr(method, qrAttachment);

  return sendHtmlEmail({
    to,
    subject,
    orderId,
    templateKey: "payment_instructions",
    html: `${htmlBody}${paymentQrHtml}`,
    attachments: qrAttachment ? [qrAttachment] : undefined,
  });
}

/**
 * Sends a separate email requesting payment of the delivery fee.
 * The amount shown is the delivery fee only, not the product subtotal.
 */
export async function sendDeliveryPaymentInstructionsEmail({
  to,
  customerName,
  orderId,
  deliveryFee,
  paymentMethod,
}: DeliveryPaymentInstructionsEmail) {
  console.log(`[Email] Loading delivery payment template for order ${orderId}`);
  validatePaymentAmount(deliveryFee, "delivery fee");

  const method = normalizePaymentMethod(paymentMethod);
  const template = await loadEmailTemplate("delivery_payment_instructions");
  const values: Record<string, string> = {
    customerName,
    orderId,
    deliveryFee: formatCurrency(deliveryFee),
    totalAmount: formatCurrency(deliveryFee),
    paymentMethod: method,
    storeName: STORE_NAME,
    paymentDetails: getPaymentDetails(method),
  };

  const subject = replacePlaceholders(template.subject, values);
  const message = replacePlaceholders(template.body, values);
  const htmlBody = renderPlainTextMessage(message);
  const qrAttachment = getPaymentQrAttachment(method);
  const paymentQrHtml = renderPaymentQr(method, qrAttachment);

  return sendHtmlEmail({
    to,
    subject,
    orderId,
    templateKey: "delivery_payment_instructions",
    html: `${htmlBody}${paymentQrHtml}`,
    attachments: qrAttachment ? [qrAttachment] : undefined,
  });
}

async function sendPaymentDecisionEmail({
  templateKey,
  to,
  customerName,
  orderId,
  storeName = STORE_NAME,
  rejectionReason = "",
}: PaymentDecisionEmail & {
  templateKey: "payment_approved" | "payment_rejected";
  rejectionReason?: string;
}) {
  const template = await loadEmailTemplate(templateKey);
  const values: Record<string, string> = {
    customerName,
    orderId,
    storeName,
    rejectionReason,
  };

  const subject = replacePlaceholders(template.subject, values);
  const message = replacePlaceholders(template.body, values);

  return sendHtmlEmail({
    to,
    subject,
    orderId,
    templateKey,
    html: renderPlainTextMessage(message),
  });
}

export async function sendPaymentApprovedEmail(details: PaymentDecisionEmail) {
  return sendPaymentDecisionEmail({
    ...details,
    templateKey: "payment_approved",
  });
}

export async function sendPaymentRejectedEmail(
  details: PaymentDecisionEmail & { rejectionReason: string }
) {
  return sendPaymentDecisionEmail({
    ...details,
    templateKey: "payment_rejected",
  });
}