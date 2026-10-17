import { Resend } from "resend";
import { supabase } from "../config/supabase";
import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing from environment variables.");
}

const resend = new Resend(apiKey);
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
const STORE_NAME = "Physical Media Store";

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
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:600px;margin:0 auto;padding:16px;">
        ${html}
      </div>
    `,
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
