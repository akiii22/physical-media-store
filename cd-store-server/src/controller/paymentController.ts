import { Request, Response } from "express";
import { supabase } from "../config/supabase";

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

          proof_url: proofUrl,

          created_at: payment.created_at,

          order: order
            ? {
                user_id: order.user_id,
                recipient_name:
                  order.recipient_name,
                phone: order.phone,
                total_amount:
                  order.total_amount,
                status: order.status,
                delivery_method:
                  order.delivery_method,
                created_at:
                  order.created_at,
              }
            : null,
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


    // ----------------------------------------------------------
    // Get payment
    // ----------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payments")
      .select(`
        id,
        order_id,
        amount,
        status
      `)
      .eq("id", paymentId)
      .single();


    if (paymentError || !payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }


    // ----------------------------------------------------------
    // Make sure payment is still pending
    // ----------------------------------------------------------

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        message:
          "This payment has already been processed.",
      });
    }


    // ----------------------------------------------------------
    // Mark payment as PAID
    // ----------------------------------------------------------

    const {
      error: updatePaymentError,
    } = await supabase
      .from("payments")
      .update({
        status: "PAID",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);


    if (updatePaymentError) {
      console.error(
        "Payment update error:",
        updatePaymentError
      );

      return res.status(500).json({
        message: "Failed to verify payment.",
      });
    }


    // ----------------------------------------------------------
    // Update order
    // ----------------------------------------------------------

    const {
      error: updateOrderError,
    } = await supabase
      .from("orders")
      .update({
        status: "PROCESSING",
      })
      .eq("id", payment.order_id);


    if (updateOrderError) {
      console.error(
        "Order update error:",
        updateOrderError
      );

      return res.status(500).json({
        message:
          "Payment was verified but order status could not be updated.",
      });
    }


    return res.status(200).json({
      message: "Payment verified successfully.",

      data: {
        payment_id: payment.id,

        order_id: payment.order_id,

        payment_status: "PAID",

        order_status: "PROCESSING",
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
// REJECT PAYMENT
// ============================================================

export const rejectPayment = async (
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


    // ----------------------------------------------------------
    // Get payment
    // ----------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payments")
      .select(`
        id,
        order_id,
        status
      `)
      .eq("id", paymentId)
      .single();


    if (paymentError || !payment) {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }


    if (payment.status !== "PENDING") {
      return res.status(400).json({
        message:
          "This payment has already been processed.",
      });
    }


    // ----------------------------------------------------------
    // Mark payment as FAILED
    // ----------------------------------------------------------

    const {
      error: updatePaymentError,
    } = await supabase
      .from("payments")
      .update({
        status: "FAILED",
      })
      .eq("id", paymentId);


    if (updatePaymentError) {
      console.error(
        "Payment rejection error:",
        updatePaymentError
      );

      return res.status(500).json({
        message: "Failed to reject payment.",
      });
    }


    // ----------------------------------------------------------
    // Keep order waiting for payment
    // ----------------------------------------------------------

    const {
      error: updateOrderError,
    } = await supabase
      .from("orders")
      .update({
        status: "PENDING_PAYMENT",
      })
      .eq("id", payment.order_id);


    if (updateOrderError) {
      console.error(
        "Order update error:",
        updateOrderError
      );

      return res.status(500).json({
        message:
          "Payment rejected but order status could not be updated.",
      });
    }


    return res.status(200).json({
      message: "Payment rejected.",

      data: {
        payment_id: payment.id,

        order_id: payment.order_id,

        payment_status: "FAILED",

        order_status: "PENDING_PAYMENT",
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