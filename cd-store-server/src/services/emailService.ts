import { Resend } from "resend";
import { supabase } from "../config/supabase";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing from environment variables.");
}

const resend = new Resend(apiKey);
const emailFrom = process.env.EMAIL_FROM || "CDs Atbp. <onboarding@resend.dev>";
const STORE_NAME = "CDs Atbp.";
const PAYMENT_QR_BUCKET = "payment-qr";

type PaymentMethod = "GCASH" | "BPI" | "GOTYME";

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

function normalizePaymentMethod(method: string): PaymentMethod {
  const normalized = method.trim().toUpperCase();

  if (normalized === "GCASH" || normalized === "BPI" || normalized === "GOTYME") {
    return normalized;
  }

  throw new Error(`Unsupported payment method: ${method}`);
}

function getPaymentDetails(method: PaymentMethod): string {
  switch (method) {
    case "GCASH": {
      const gcashNumber = process.env.PAYMENT_GCASH_NUMBER?.trim();

      if (!gcashNumber) {
        throw new Error("PAYMENT_GCASH_NUMBER is missing from backend environment variables.");
      }

      return `GCash account number: ${gcashNumber}`;
    }
    case "BPI":
      return "Scan the BPI QR code included below to complete your payment.";
    case "GOTYME":
      return "Scan the GoTyme QR code included below to complete your payment.";
  }
}

/**
 * Downloads only the QR image matching the selected payment method from the
 * private Supabase Storage bucket and prepares it as a Resend inline attachment.
 */
async function getPaymentQrAttachment(
  method: PaymentMethod
): Promise<InlineQrAttachment | null> {
  if (method === "GCASH") {
    return null;
  }

  const qrFiles: Record<Exclude<PaymentMethod, "GCASH">, string> = {
    BPI: "bpi-qr.jpg",
    GOTYME: "gotyme-qr.jpg",
  };

  const filename = qrFiles[method];
  const { data, error } = await supabase.storage
    .from(PAYMENT_QR_BUCKET)
    .download(filename);

  if (error || !data) {
    console.error(`[Email] Failed to download ${filename} from Supabase Storage:`, error?.message);
    throw new Error(`Unable to retrieve the ${method} payment QR code. Payment instructions were not sent.`);
  }

  const contentId = `${method.toLowerCase()}-payment-qr`;

  return {
    filename,
    content: Buffer.from(await data.arrayBuffer()).toString("base64"),
    contentId,
  };
}

function renderPaymentQr(
  method: PaymentMethod,
  attachment: InlineQrAttachment | null
): string {
  if (method === "GCASH") {
    return "";
  }

  if (!attachment) {
    throw new Error(`Missing inline QR attachment for ${method}.`);
  }

  const bankName = method === "BPI" ? "BPI" : "GoTyme";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="margin:28px 0;background:#f8f5ef;border:1px solid #e8e1d6;border-radius:12px;">
      <tr>
        <td align="center" style="padding:26px 20px;">
          <p style="margin:0 0 8px;color:#a45f3d;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
            Payment QR
          </p>
          <h2 style="margin:0 0 12px;color:#292722;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;">
            Pay with ${escapeHtml(bankName)}
          </h2>
          <p style="margin:0 0 20px;color:#6f6a60;font-size:14px;line-height:1.6;">
            Scan this QR code using your ${escapeHtml(bankName)} app.
          </p>
          <div style="display:inline-block;padding:12px;background:#ffffff;border:1px solid #e8e1d6;border-radius:12px;">
            <img
              src="cid:${escapeHtml(attachment.contentId)}"
              alt="${escapeHtml(bankName)} payment QR code"
              width="230"
              style="display:block;width:230px;max-width:100%;height:auto;border:0;"
            />
          </div>
          <p style="margin:18px 0 0;color:#6f6a60;font-size:12px;line-height:1.6;">
            Before confirming, verify the recipient name and payment amount in your banking app.
          </p>
        </td>
      </tr>
    </table>
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
<body style="margin:0;padding:0;background:#f2eee7;font-family:Arial,Helvetica,sans-serif;color:#292722;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    An update from ${escapeHtml(STORE_NAME)} regarding your order.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background:#f2eee7;padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:600px;background:#ffffff;border:1px solid #e8e1d6;">
          <tr>
            <td align="center" style="background:#25241f;padding:38px 24px 32px;color:#f9f5ed;">
              <p style="margin:0;color:#d7b49a;font-size:10px;letter-spacing:3px;text-transform:uppercase;">
                Curated music &amp; physical media
              </p>
              <h1 style="margin:12px 0 8px;color:#f9f5ed;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;letter-spacing:1px;">
                ${escapeHtml(STORE_NAME)}
              </h1>
              <p style="margin:0;color:#d9d5cd;font-size:12px;letter-spacing:1px;">
                Records, memories, and everything in between.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 30px 30px;">
              <p style="margin:0 0 12px;color:#a45f3d;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
                A note from our store
              </p>
              <h2 style="margin:0 0 22px;color:#292722;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.35;font-weight:normal;">
                ${safeSubject}
              </h2>
              <div style="font-size:15px;line-height:1.9;color:#4b4942;overflow-wrap:anywhere;">
                ${content}
              </div>
              <div style="margin-top:32px;padding-top:22px;border-top:1px solid #eee7dc;">
                <p style="margin:0;color:#292722;font-size:14px;font-weight:bold;">
                  Thank you for shopping with us.
                </p>
                <p style="margin:8px 0 0;color:#777167;font-size:13px;line-height:1.7;">
                  If you have questions about your order or payment, simply reply to this email or contact our store.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#f9f6f0;padding:24px 20px;border-top:1px solid #eee7dc;">
              <p style="margin:0;color:#292722;font-family:Georgia,'Times New Roman',serif;font-size:17px;">
                ${escapeHtml(STORE_NAME)}
              </p>
              <p style="margin:8px 0 0;color:#777167;font-size:11px;line-height:1.7;">
                Made for music lovers.<br>
                Automated transactional message about your order.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
  const qrAttachment = await getPaymentQrAttachment(method);
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
  const qrAttachment = await getPaymentQrAttachment(method);
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
