import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import multer from "multer";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {sendPaymentApprovedEmail, sendPaymentRejectedEmail, sendDeliveryPaymentInstructionsEmail} from "../services/emailService";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}


// ============================================================
// UPLOAD PAYMENT PROOF
// ============================================================

export const uploadPaymentProof = async (
  req: MulterRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const file = req.file;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "Payment proof is required.",
      });
    }


    // ----------------------------------------------------------
    // Get order
    // ----------------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();


    if (orderError || !order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }


    // ----------------------------------------------------------
    // Check order status
    // ----------------------------------------------------------

    if (order.status !== "PENDING_PAYMENT") {
      return res.status(400).json({
        message: "This order is not awaiting payment.",
      });
    }


    // ----------------------------------------------------------
    // Generate unique file path
    // ----------------------------------------------------------

    const fileExtension =
      file.originalname.split(".").pop();

    const filePath =
      `${orderId}/${crypto.randomUUID()}.${fileExtension}`;


    // ----------------------------------------------------------
    // Upload to Supabase Storage
    // ----------------------------------------------------------

    const {
      error: uploadError,
    } = await supabase.storage
      .from("payment_proof")
      .upload(
        filePath,
        file.buffer,
        {
          contentType: file.mimetype,
          upsert: false,
        }
      );


    if (uploadError) {
      console.error(
        "Storage upload error:",
        uploadError
      );

      return res.status(500).json({
        message: "Failed to upload payment proof.",
      });
    }


    // ----------------------------------------------------------
    // Update payment record
    // ----------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payments")
      .update({
        proof_url: filePath,
        status: "PENDING",
      })
      .eq("order_id", orderId)
      .in("status", ["PENDING", "FAILED"])
      .select("id")
      .single();


    if (paymentError || !payment) {
      console.error(
        "Payment update error:",
        paymentError
      );

      return res.status(500).json({
        message:
          "File uploaded but payment record could not be updated.",
      });
    }


    return res.status(200).json({
      message:
        "Payment proof uploaded successfully.",

      data: {
        order_id: orderId,
        payment_id: payment.id,
        proof_path: filePath,
      },
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};



// ============================================================
// GET PENDING PAYMENTS
// ============================================================

export const getPendingPayments = async (
  _req: Request,
  res: Response
) => {
  try {

    // ----------------------------------------------------------
    // Get pending payments
    // ----------------------------------------------------------

    const {
      data: payments,
      error: paymentsError,
    } = await supabase
      .from("payments")
      .select(`
  id,
  order_id,
  method,
  amount,
  status,
  payment_type,
  proof_url,
  created_at
      `)
      .eq("status", "PENDING")
      .not("proof_url", "is", null)
      .order("created_at", {
        ascending: false,
      });


    if (paymentsError) {
      console.error(
        "Payments error:",
        paymentsError
      );

      return res.status(500).json({
        message: "Failed to retrieve pending payments.",
      });
    }


    if (!payments || payments.length === 0) {
      return res.status(200).json({
        message: "No pending payments found.",
        data: [],
      });
    }


    // ----------------------------------------------------------
    // Get orders
    // ----------------------------------------------------------

    const orderIds = payments.map(
      (payment) => payment.order_id
    );

    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        recipient_name,
        phone,
        total_amount,
        status,
        delivery_method,
        created_at
      `)
      .in("id", orderIds);


    if (ordersError) {
      console.error(
        "Orders error:",
        ordersError
      );

      return res.status(500).json({
        message: "Failed to retrieve orders.",
      });
    }


    // ----------------------------------------------------------
    // Generate signed URLs for receipts
    // ----------------------------------------------------------

    const result = await Promise.all(
      payments.map(async (payment) => {

        const order = orders?.find(
          (order) =>
            order.id === payment.order_id
        );


        let proofUrl: string | null = null;


        if (payment.proof_url) {

          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await supabase.storage
            .from("payment_proof")
            .createSignedUrl(
              payment.proof_url,
              60 * 10
            );


          if (signedUrlError) {
            console.error(
              "Signed URL error:",
              signedUrlError
            );
          } else {
            proofUrl =
              signedUrlData.signedUrl;
          }
        }


        return {
          payment_id: payment.id,
  order_id: payment.order_id,
  payment_method: payment.method,
  amount: payment.amount,
  payment_status: payment.status,
  payment_type: payment.payment_type,
  proof_url: proofUrl,
  created_at: payment.created_at,
  order: order
    ? {
        user_id: order.user_id,
        recipient_name: order.recipient_name,
        phone: order.phone,
        total_amount: order.total_amount,
        status: order.status,
        delivery_method: order.delivery_method,
        created_at: order.created_at,
      }
    : null
        };
      })
    );


    return res.status(200).json({
      message:
        "Pending payments retrieved successfully.",

      data: result,
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};



// ============================================================
// VERIFY PAYMENT
// ============================================================


export const verifyPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        message: "Payment ID is required.",
      });
    }

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .select("id, order_id, amount, status, payment_type")
        .eq("id", paymentId)
        .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        message: "This payment has already been processed.",
      });
    }

    const now = new Date().toISOString();

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "PAID",
        paid_at: now,
      })
      .eq("id", paymentId)
      .eq("status", "PENDING");

    if (updatePaymentError) {
      console.error("Payment update error:", updatePaymentError);

      return res.status(500).json({
        message: "Failed to verify payment.",
      });
    }

    let orderUpdate;

    if (payment.payment_type === "DELIVERY") {
      // Delivery fee paid: preserve the existing order status.
      orderUpdate = await supabase
        .from("orders")
        .update({
          delivery_fee_status: "PAID",
          updated_at: now,
        })
        .eq("id", payment.order_id);
    } else {
      // Product payment approved.
      orderUpdate = await supabase
        .from("orders")
        .update({
          status: "PROCESSING",
          updated_at: now,
        })
        .eq("id", payment.order_id);
    }

    if (orderUpdate.error) {
      console.error("Order update error:", orderUpdate.error);

      return res.status(500).json({
        message:
          "Payment was verified, but the order update failed. Please check the records before retrying.",
      });
    }

    // Load the customer details needed for the email.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", payment.order_id)
      .single();

    let emailSent = false;

    if (orderError || !order) {
      console.error("Could not load order for email:", orderError);
    } else {
      const { data: customer, error: customerError } =
        await supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .single();

      if (customerError || !customer?.email) {
        console.error(
          "Could not load customer email:",
          customerError
        );
      } else {
        try {
          await sendPaymentApprovedEmail({
            to: customer.email,
            customerName: "Customer",
            orderId: String(payment.order_id),
            storeName: "Physical Media Store",
          });

          emailSent = true;
        } catch (emailError) {
          console.error(
            "Payment approved, but email failed:",
            emailError
          );
        }
      }
    }

    return res.status(200).json({
      message: "Payment verified successfully.",
      data: {
        payment_id: payment.id,
        order_id: payment.order_id,
        payment_status: "PAID",
        payment_type: payment.payment_type,
        email_sent: emailSent,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};


export const createDeliveryPayment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { order_id, method } = req.body;
    const user_id = req.user?.id;

    if (!user_id || !order_id || !method) {
      return res.status(400).json({
        message: "Order ID and payment method are required.",
      });
    }

    const normalizedMethod =
      typeof method === "string" ? method.trim().toUpperCase() : "";

    if (!["GCASH", "MAYA", "CARD"].includes(normalizedMethod)) {
      return res.status(400).json({
        message: "Invalid payment method.",
      });
    }

    // Get the customer's order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, recipient_name, delivery_fee, delivery_fee_status")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Ensure the order belongs to the logged-in customer.
    if (order.user_id !== user_id) {
      return res.status(403).json({
        message: "You are not allowed to pay for this order.",
      });
    }

    const deliveryFee = Number(order.delivery_fee);

    if (!Number.isFinite(deliveryFee) || deliveryFee <= 0) {
      return res.status(400).json({
        message: "There is no delivery fee to pay.",
      });
    }

    if (order.delivery_fee_status === "PAID") {
      return res.status(400).json({
        message: "The delivery fee has already been paid.",
      });
    }

    // Retrieve the customer's registered email.
    const { data: customer, error: customerError } = await supabase
      .from("users")
      .select("email")
      .eq("id", user_id)
      .maybeSingle();

    if (customerError || !customer?.email) {
      console.error("Failed to retrieve customer email:", customerError);

      return res.status(400).json({
        message: "Unable to retrieve your registered email address.",
      });
    }

    // Reuse an existing pending delivery payment when available.
    const { data: existingPayment, error: lookupError } = await supabase
      .from("payments")
      .select("id, order_id, amount, method, status, payment_type")
      .eq("order_id", order_id)
      .eq("payment_type", "DELIVERY")
      .eq("status", "PENDING")
      .maybeSingle();

    if (lookupError) {
      console.error("Delivery payment lookup failed:", lookupError);

      return res.status(500).json({
        message: "Failed to check the existing delivery payment.",
      });
    }

    let payment = existingPayment;

    if (payment) {
      // Do not silently switch methods on an existing payment.
      if (payment.method !== normalizedMethod) {
        return res.status(409).json({
          message:
            "A pending delivery payment already exists with another method. Please use that method or contact the store.",
          data: payment,
        });
      }
    } else {
      // Create a new delivery payment.
      const { data: newPayment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id,
          method: normalizedMethod,
          amount: deliveryFee,
          status: "PENDING",
          payment_type: "DELIVERY",
        })
        .select()
        .single();

      if (paymentError || !newPayment) {
        console.error(
          "Failed to create delivery payment:",
          paymentError
        );

        return res.status(500).json({
          message: "Failed to create delivery payment.",
        });
      }

      payment = newPayment;
    }

    // Send payment instructions. Email failure does not delete the payment.
    let emailSent = false;

    try {
      await sendDeliveryPaymentInstructionsEmail({
        to: customer.email,
        customerName: order.recipient_name || "Customer",
        orderId: String(order.id),
        deliveryFee,
        paymentMethod: normalizedMethod,
      });

      emailSent = true;
    } catch (emailError) {
      console.error(
        `Delivery payment email failed for order ${order.id}:`,
        emailError
      );
    }

    return res.status(200).json({
      message: emailSent
        ? "Delivery payment is ready. Instructions have been emailed to you."
        : "Delivery payment is ready, but the email could not be sent. Please check your order page or contact support.",
      data: payment,
      email_sent: emailSent,
    });
  } catch (error) {
    console.error("Create delivery payment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};


export const uploadDeliveryPaymentProof = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const file = req.file;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "Delivery payment proof is required.",
      });
    }

    // ----------------------------------------------------------
    // Get order
    // ----------------------------------------------------------

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, delivery_fee, delivery_fee_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // ----------------------------------------------------------
    // Make sure customer owns the order
    // ----------------------------------------------------------

    if (order.user_id !== req.user?.id) {
      return res.status(403).json({
        message: "You do not have permission to update this order.",
      });
    }

    // ----------------------------------------------------------
    // Validate delivery fee
    // ----------------------------------------------------------

    if (!order.delivery_fee || order.delivery_fee <= 0) {
      return res.status(400).json({
        message: "No delivery fee is currently set.",
      });
    }

    if (order.delivery_fee_status === "PAID") {
      return res.status(400).json({
        message: "Delivery fee has already been paid.",
      });
    }

    // ----------------------------------------------------------
    // Find DELIVERY payment
    // ----------------------------------------------------------

    const { data: payment, error: paymentLookupError } =
      await supabase
        .from("payments")
        .select("id, status, payment_type")
        .eq("order_id", orderId)
        .eq("payment_type", "DELIVERY")
        .in("status", ["PENDING", "FAILED"])
        .maybeSingle();

    if (paymentLookupError) {
      console.error(
        "Delivery payment lookup error:",
        paymentLookupError
      );

      return res.status(500).json({
        message: "Failed to find delivery payment.",
      });
    }

    if (!payment) {
      return res.status(404).json({
        message: "Delivery payment has not been created yet.",
      });
    }

    // ----------------------------------------------------------
    // Upload proof to Storage
    // ----------------------------------------------------------

    const fileExtension =
      file.originalname.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `${orderId}/delivery-${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
  .from("payment_proof")
  .upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

if (uploadError) {
  console.error(
    "Delivery proof storage error:",
    uploadError
  );

  return res.status(500).json({
    message: "Failed to upload delivery payment proof.",
  });
}

const { data: publicUrlData } = supabase.storage
  .from("payment_proof")
  .getPublicUrl(filePath);

const proofUrl = publicUrlData.publicUrl;

    // ----------------------------------------------------------
    // Update DELIVERY payment
    // ----------------------------------------------------------

    const { data: updatedPayment, error: updateError } =
      await supabase
        .from("payments")
        .update({
          proof_url: proofUrl,
          status: "PENDING",
        })
        .eq("id", payment.id)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Delivery payment update error:",
        updateError
      );

      return res.status(500).json({
        message: "Failed to update delivery payment.",
      });
    }

    return res.status(200).json({
      message: "Delivery payment proof uploaded successfully.",
      data: updatedPayment,
    });
  } catch (error) {
    console.error(
      "Upload delivery payment proof error:",
      error
    );

    return res.status(500).json({
      message: "Failed to upload delivery payment proof.",
    });
  }
};



// ============================================================
// REJECT PAYMENT
// ============================================================


export const rejectPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const { paymentId } = req.params;
    const rejectionReason =
      typeof req.body?.rejectionReason === "string"
        ? req.body.rejectionReason.trim()
        : "";

    if (!paymentId) {
      return res.status(400).json({
        message: "Payment ID is required.",
      });
    }

    if (!rejectionReason || rejectionReason.length > 1000) {
      return res.status(400).json({
        message:
          "A rejection reason is required and must be at most 1000 characters.",
      });
    }

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .select("id, order_id, status, payment_type")
        .eq("id", paymentId)
        .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        message: "This payment has already been processed.",
      });
    }

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "FAILED",
      })
      .eq("id", paymentId)
      .eq("status", "PENDING");

    if (updatePaymentError) {
      console.error(
        "Payment rejection error:",
        updatePaymentError
      );

      return res.status(500).json({
        message: "Failed to reject payment.",
      });
    }

    let orderUpdate;

    if (payment.payment_type === "DELIVERY") {
      orderUpdate = await supabase
        .from("orders")
        .update({
          delivery_fee_status: "PENDING",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id);
    } else {
      orderUpdate = await supabase
        .from("orders")
        .update({
          status: "PENDING_PAYMENT",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.order_id);
    }

    if (orderUpdate.error) {
      console.error(
        "Order update error:",
        orderUpdate.error
      );

      return res.status(500).json({
        message:
          "Payment was rejected, but the order update failed. Please check the records before retrying.",
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", payment.order_id)
      .single();

    let emailSent = false;

    if (orderError || !order) {
      console.error("Could not load order for email:", orderError);
    } else {
      const { data: customer, error: customerError } =
        await supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .single();

      if (customerError || !customer?.email) {
        console.error(
          "Could not load customer email:",
          customerError
        );
      } else {
        try {
          await sendPaymentRejectedEmail({
            to: customer.email,
            customerName: "Customer",
            orderId: String(payment.order_id),
            rejectionReason,
            storeName: "Physical Media Store",
          });

          emailSent = true;
        } catch (emailError) {
          console.error(
            "Payment rejected, but email failed:",
            emailError
          );
        }
      }
    }

    return res.status(200).json({
      message: "Payment rejected successfully.",
      data: {
        payment_id: payment.id,
        order_id: payment.order_id,
        payment_status: "FAILED",
        payment_type: payment.payment_type,
        email_sent: emailSent,
      },
    });
  } catch (error) {
    console.error("Reject payment error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
