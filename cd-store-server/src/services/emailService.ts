import { Resend } from "resend";
import { supabase } from "../config/supabase";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "RESEND_API_KEY is missing from environment variables."
  );
}

const resend = new Resend(apiKey);

const emailFrom =
  process.env.EMAIL_FROM || "onboarding@resend.dev";

type PaymentInstructionsEmail = {
  to: string;
  customerName: string;
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function replacePlaceholders(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (placeholder, key: string) => values[key] ?? placeholder
  );
}

export async function sendPaymentInstructionsEmail({
  to,
  customerName,
  orderId,
  totalAmount,
  paymentMethod,
}: PaymentInstructionsEmail) {
  console.log(
    `[Email] Loading payment template for order ${orderId}`
  );

  const { data: template, error: templateError } =
    await supabase
      .from("email_templates")
      .select("subject, body")
      .eq("template_key", "payment_instructions")
      .eq("is_active", true)
      .maybeSingle();

  if (templateError) {
    console.error(
      "[Email] Failed to load template:",
      templateError
    );

    throw new Error(
      "Unable to load the payment email template."
    );
  }

  if (!template) {
    throw new Error(
      "The payment_instructions template is missing or inactive."
    );
  }

  if (
    !Number.isFinite(totalAmount) ||
    totalAmount < 0
  ) {
    throw new Error("Invalid order total for payment email.");
  }

  const amount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(totalAmount);

  const method = paymentMethod.toUpperCase();

  let paymentDetails: string;

  if (method === "GCASH") {
    paymentDetails =
      `GCash number: ${
        process.env.PAYMENT_GCASH_NUMBER ||
        "Contact the store for payment details"
      }`;
  } else if (method === "MAYA") {
    paymentDetails =
      `Maya number: ${
        process.env.PAYMENT_MAYA_NUMBER ||
        "Contact the store for payment details"
      }`;
  } else {
    paymentDetails =
      "Please follow the payment instructions shown on our website.";
  }

  const values: Record<string, string> = {
    customerName,
    orderId,
    totalAmount: amount,
    paymentMethod: method,
    storeName: "Physical Media Store",
    paymentDetails,
  };

  const subject = replacePlaceholders(
    template.subject,
    values
  );

  const message = replacePlaceholders(
    template.body,
    values
  );

  // The template body is plain text, not HTML.
  const htmlBody = escapeHtml(message).replace(
    /\r?\n/g,
    "<br />"
  );

  console.log("[Email] Submitting email to Resend:", {
    recipient: to,
    orderId,
    templateKey: "payment_instructions",
  });

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: [to],
    subject,
    html: `
      <div style="
        font-family: Arial, sans-serif;
        line-height: 1.7;
        color: #222;
        max-width: 600px;
        margin: 0 auto;
      ">
        ${htmlBody}
      </div>
    `,
  });

  if (error) {
    console.error("[Email] Resend rejected the request:", {
      message: error.message,
      orderId,
    });

    throw new Error(error.message);
  }

  console.log("[Email] Resend accepted the request:", {
    orderId,
    emailId: data?.id,
  });

  return data;
}