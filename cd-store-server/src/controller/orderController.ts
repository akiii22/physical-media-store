import { Response } from "express";
import { supabase } from "../config/supabase";
import type { CreateOrderInput } from "../types/order";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendPaymentInstructionsEmail } from "../services/emailService";

// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {

  console.log("[DEBUG] UPDATED createOrder controller is running");
  try {
    const body = req.body as CreateOrderInput;

    const {
      customer_name,
      phone,
      province,
      city,
      barangay,
      street_address,
      postal_code,
      delivery_method,
      payment_method,
      items,
    } = body;

    const user_id = req.user?.id;

    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    if (
      !user_id ||
      !customer_name?.trim() ||
      !phone?.trim() ||
      !delivery_method ||
      !payment_method ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required order information.",
      });
    }

    // ----------------------------------------------------------
    // Validate delivery/payment methods and address
    // ----------------------------------------------------------

    if (!["DELIVERY", "SAME_DAY", "STORE_PICKUP"].includes(delivery_method)) {
      return res.status(400).json({
        message: "Invalid delivery method.",
      });
    }

    if (!["GCASH", "MAYA", "CARD"].includes(payment_method)) {
      return res.status(400).json({
        message: "Invalid payment method.",
      });
    }

    if (
      delivery_method !== "STORE_PICKUP" &&
      (!province?.trim() ||
        !city?.trim() ||
        !barangay?.trim() ||
        !street_address?.trim())
    ) {
      return res.status(400).json({
        message: "Complete delivery address is required.",
      });
    }

    // ----------------------------------------------------------
    // Validate order quantities
    // ----------------------------------------------------------

    for (const item of items) {
      if (
        !item.product_id ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          message: "Invalid order item or quantity.",
        });
      }
    }

    // ----------------------------------------------------------
    // Retrieve the customer's registered email
    // ----------------------------------------------------------

    const {
      data: customer,
      error: customerError,
    } = await supabase
      .from("users")
      .select("email")
      .eq("id", user_id)
      .single();

    if (customerError || !customer?.email) {
      console.error(
        "Failed to retrieve customer email:",
        customerError
      );

      return res.status(400).json({
        message:
          "Unable to retrieve your registered email address.",
      });
    }

    const customerEmail = customer.email;

    // ----------------------------------------------------------
    // Create the order, reserve stock, create order items and payment
    // atomically in PostgreSQL. The RPC uses database prices and locks
    // product rows so concurrent checkouts cannot oversell inventory.
    // ----------------------------------------------------------

    const { data: checkoutResult, error: checkoutError } = await supabase.rpc(
      "create_order_with_stock_reservation",
      {
        p_user_id: user_id,
        p_customer_name: customer_name.trim(),
        p_phone: phone.trim(),
        p_province: province?.trim() || null,
        p_city: city?.trim() || null,
        p_barangay: barangay?.trim() || null,
        p_street_address: street_address?.trim() || null,
        p_postal_code: postal_code?.trim() || null,
        p_delivery_method: delivery_method,
        p_payment_method: payment_method,
        p_items: items,
      }
    );

    if (checkoutError || !checkoutResult) {
      const message = checkoutError?.message ?? "Unknown checkout error";
      console.error("Atomic checkout failed:", checkoutError);

      if (message.includes("INSUFFICIENT_STOCK")) {
        return res.status(409).json({
          message: "One or more products no longer have enough stock. Please refresh your cart and try again.",
        });
      }

      if (message.includes("PRODUCT_NOT_FOUND")) {
        return res.status(400).json({ message: "One or more products no longer exist." });
      }

      if (message.includes("INVALID_ORDER_ITEM") || message.includes("ORDER_ITEMS_REQUIRED")) {
        return res.status(400).json({ message: "Invalid order items or quantities." });
      }

      return res.status(500).json({
        message: "Failed to complete checkout. No stock should be reserved unless the transaction succeeds.",
      });
    }

    const orderId = String(checkoutResult.order_id);
    const totalAmount = Number(checkoutResult.total_amount);
    const orderStatus = String(checkoutResult.status);

    // ----------------------------------------------------------
    // Send payment instructions email
    // ----------------------------------------------------------

 // Send payment instructions email.
let emailSent = false;

console.log("[Order] Order and payment created:", {
  orderId,
  customerEmail,
});

try {
  await sendPaymentInstructionsEmail({
    to: customerEmail,
    customerName: customer_name.trim(),
    orderId,
    totalAmount,
    paymentMethod: payment_method,
  });

  emailSent = true;
} catch (emailError) {
  console.error(
    `[Order] Payment email failed for order ${orderId}:`,
    emailError
  );
}

// An email failure must not cause another order to be created.
return res.status(201).json({
  message: emailSent
    ? "Order created successfully. Payment instructions have been emailed to you."
    : "Order created successfully, but the payment email could not be sent. Please check your order page or contact support.",
  data: {
    order_id: orderId,
    total_amount: totalAmount,
    status: orderStatus,
    email_sent: emailSent,
  },
});
  } catch (error) {
    console.error("Create order server error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};



// ============================================================
// GET ORDER BY ID
// ============================================================

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response
) => {

  try {

    const { orderId } = req.params;


    // ----------------------------------------------------------
    // Validate order ID
    // ----------------------------------------------------------

    if (!orderId) {

      return res.status(400).json({
        message: "Order ID is required.",
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
      .select(`
        id,
        status,
        total_amount,
        delivery_method,
        recipient_name,
        phone,
        province,
        city,
        barangay,
        street_address,
        postal_code,
        created_at
      `)
      .eq("id", orderId)
      .single();


    if (orderError || !order) {

      console.error(orderError);

      return res.status(404).json({
        message: "Order not found.",
      });

    }


    // ----------------------------------------------------------
    // Get payment information
    // ----------------------------------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from("payments")
      .select(`
        method,
        amount,
        status,
        payment_type,
        proof_url,
        paid_at
      `)
      .eq("order_id", orderId)
      .single();


    if (paymentError || !payment) {

      console.error(paymentError);

      return res.status(404).json({
        message: "Payment information not found.",
      });

    }


    // ----------------------------------------------------------
    // Return order + payment
    // ----------------------------------------------------------

    return res.status(200).json({

      message: "Order retrieved successfully.",

      data: {

        order_id: order.id,

        status: order.status,

        total_amount: order.total_amount,

        delivery_method:
          order.delivery_method,

        recipient_name:
          order.recipient_name,

        phone:
          order.phone,

        province:
          order.province,

        city:
          order.city,

        barangay:
          order.barangay,

        street_address:
          order.street_address,

        postal_code:
          order.postal_code,

        created_at:
          order.created_at,


        payment: {

          method:
            payment.method,

          amount:
            payment.amount,

          status:
            payment.status,

          proof_url:
            payment.proof_url,

          paid_at:
            payment.paid_at,

        },

      },

    });

  } catch (error) {

    console.error(
      "Get order server error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};


export const getAllOrders = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        users (
          id,
          email,
          role
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price
        ),
        payments (
          id,
          method,
          amount,
          status,
          payment_type,
          proof_url,
          provider_reference,
          paid_at
        ),
        shipments (
          id,
          courier,
          tracking_number,
          status,
          tracking_url,
          shipped_at,
          delivered_at
        )
      `)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FAILED TO FETCH ORDERS:", error);

      return res.status(500).json({
        message: "Failed to retrieve orders.",
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      message: "Failed to retrieve orders.",
    });
  }
};


export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body ?? {}

    console.log("METHOD:", req.method);
console.log("CONTENT TYPE:", req.headers["content-type"]);
console.log("BODY:", req.body);

    const allowedStatuses = [
      "PENDING_PAYMENT",
      "PAYMENT_FAILED",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    if (status === "CANCELLED") {
      // The route is shared with STAFF for normal order management, but only
      // ADMIN may cancel because cancellation releases reserved inventory.
      if (req.role !== "ADMIN") {
        return res.status(403).json({
          message: "Only an administrator can cancel an order.",
        });
      }

      const { data, error } = await supabase.rpc(
        "cancel_order_and_restore_stock",
        { p_order_id: orderId }
      );

      if (error || !data) {
        console.error("FAILED TO CANCEL ORDER AND RESTORE STOCK:", error);
        const errorMessage = error?.message ?? "";
        const isMissing = errorMessage.includes("ORDER_NOT_FOUND");
        const cannotCancel =
          errorMessage.includes("CANNOT_CANCEL_ORDER_IN_CURRENT_STATUS") ||
          errorMessage.includes("ORDER_HAS_PAID_PAYMENT");
        return res.status(isMissing ? 404 : cannotCancel ? 409 : 500).json({
          message: isMissing
            ? "Order not found."
            : cannotCancel
              ? "This order cannot be cancelled through this action. Paid or in-progress orders require a separate cancellation/refund process."
              : "Failed to cancel order and restore reserved stock.",
        });
      }

      return res.status(200).json({
        message: "Order cancelled successfully. Reserved stock was restored if applicable.",
        data,
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

   if (error) {
  console.error("FAILED TO UPDATE ORDER STATUS:", error);

  return res.status(500).json({
    message: "Failed to update order status.",
    error: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

    return res.status(200).json({
      message: "Order status updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status.",
    });
  }
};

export const updateDeliveryFee = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const { delivery_fee } = req.body ?? {};

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    const fee = Number(delivery_fee);

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({
        message: "Delivery fee must be a valid number greater than or equal to 0.",
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, delivery_method")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Store pickup does not have a delivery fee.
    if (order.delivery_method === "STORE_PICKUP" && fee > 0) {
      return res.status(400).json({
        message: "Store pickup orders cannot have a delivery fee.",
      });
    }

    const deliveryFeeStatus = fee > 0 ? "PENDING" : "NOT_SET";

    const { data, error } = await supabase
      .from("orders")
      .update({
        delivery_fee: fee,
        delivery_fee_status: deliveryFeeStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, delivery_fee, delivery_fee_status, updated_at")
      .single();

    if (error) {
      console.error("Failed to update delivery fee:", error);

      return res.status(500).json({
        message: "Failed to update delivery fee.",
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "Delivery fee updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update delivery fee error:", error);

    return res.status(500).json({
      message: "Failed to update delivery fee.",
    });
  }
};

export const updateShipment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;

    const {
      courier,
      tracking_number,
      tracking_url,
      status,
    } = req.body ?? {};

    console.log("UPDATE SHIPMENT");
    console.log("ORDER ID:", orderId);
    console.log("BODY:", req.body);

    const allowedStatuses = [
      "PENDING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status.",
      });
    }

    // Make sure the order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, delivery_method")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Store pickup does not require shipment information
    if (order.delivery_method === "STORE_PICKUP") {
      return res.status(400).json({
        message:
          "Store pickup orders do not require shipment information.",
      });
    }

    // Check whether shipment already exists
    const { data: existingShipment, error: shipmentLookupError } =
      await supabase
        .from("shipments")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

    if (shipmentLookupError) {
      console.error(
        "Shipment lookup error:",
        shipmentLookupError
      );

      return res.status(500).json({
        message: "Failed to check existing shipment.",
        error: shipmentLookupError.message,
      });
    }

    let shipment;

    if (existingShipment) {
      // Update existing shipment
      const { data, error } = await supabase
        .from("shipments")
        .update({
          courier: courier || null,
          tracking_number: tracking_number || null,
          tracking_url: tracking_url || null,
          status,
          shipped_at:
            status === "SHIPPED"
              ? new Date().toISOString()
              : undefined,
          delivered_at:
            status === "DELIVERED"
              ? new Date().toISOString()
              : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingShipment.id)
        .select()
        .single();

      if (error) {
        console.error(
          "Failed to update shipment:",
          error
        );

        return res.status(500).json({
          message: "Failed to update shipment.",
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }

      shipment = data;
    } else {
      // Create shipment
      const { data, error } = await supabase
        .from("shipments")
        .insert({
          order_id: orderId,
          courier: courier || null,
          tracking_number: tracking_number || null,
          tracking_url: tracking_url || null,
          status,
          shipped_at:
            status === "SHIPPED"
              ? new Date().toISOString()
              : null,
          delivered_at:
            status === "DELIVERED"
              ? new Date().toISOString()
              : null,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Failed to create shipment:",
          error
        );

        return res.status(500).json({
          message: "Failed to create shipment.",
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }

      shipment = data;
    }

    // Keep order status synchronized
    let orderStatus = "PROCESSING";

    if (status === "READY_TO_SHIP") {
      orderStatus = "READY_TO_SHIP";
    }

    if (status === "SHIPPED") {
      orderStatus = "SHIPPED";
    }

    if (status === "DELIVERED") {
      orderStatus = "DELIVERED";
    }

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString(),
        delivered_at:
          status === "DELIVERED"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      console.error(
        "Failed to synchronize order status:",
        orderUpdateError
      );

      return res.status(500).json({
        message:
          "Shipment updated, but order status synchronization failed.",
        error: orderUpdateError.message,
      });
    }

    return res.status(200).json({
      message: "Shipment updated successfully.",
      data: shipment,
    });
  } catch (error) {
    console.error("Update shipment error:", error);

    return res.status(500).json({
      message: "Failed to update shipment.",
    });
  }
};


export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const pageParam = Number(req.query.page ?? 1);
    const limitParam = Number(req.query.limit ?? 5);

    const page = Number.isInteger(pageParam) && pageParam > 0
      ? pageParam
      : 1;

    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, 20)
      : 5;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("orders")
      .select(
        `
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price
          ),
          payments (
            id,
            method,
            amount,
            status,
            payment_type,
            proof_url,
            provider_reference,
            paid_at
          ),
          shipments (
            id,
            courier,
            tracking_number,
            status,
            tracking_url,
            shipped_at,
            delivered_at
          )
        `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to retrieve customer orders:", error);

      return res.status(500).json({
        message: "Failed to retrieve your orders.",
      });
    }

    const total = count ?? 0;

    return res.status(200).json({
      message: "Orders retrieved successfully.",
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      message: "Failed to retrieve your orders.",
    });
  }
};



// ============================================================
// SALES REPORT
// ADMIN + STAFF
// ============================================================

export const getSalesReport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date format
    const isValidDate = (value: unknown): value is string => {
      if (typeof value !== "string") return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        message:
          "Valid startDate and endDate are required (YYYY-MM-DD).",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "startDate must be on or before endDate.",
      });
    }

    // Use an inclusive date range in Philippine time (UTC+8).
    const start = new Date(
      `${startDate}T00:00:00+08:00`
    ).toISOString();

    const endExclusive = new Date(
      new Date(`${endDate}T00:00:00+08:00`).getTime() +
        24 * 60 * 60 * 1000
    ).toISOString();

    // Only confirmed PRODUCT payments count as sales.
    // Delivery-fee payments are intentionally excluded.
    const { data: payments, error: paymentsError } =
      await supabase
        .from("payments")
        .select(`
          id,
          order_id,
          amount,
          method,
          paid_at,
          orders (
            id,
            created_at,
            recipient_name,
            order_items (
              id,
              quantity,
              unit_price,
              products (
                name
              )
            )
          )
        `)
        .eq("status", "PAID")
        .eq("payment_type", "PRODUCT")
        .gte("paid_at", start)
        .lt("paid_at", endExclusive)
        .order("paid_at", { ascending: false });

    if (paymentsError) {
      console.error("Sales report query failed:", paymentsError);

      return res.status(500).json({
        message: "Failed to generate sales report.",
      });
    }

    type ReportOrderItem = {
      id: string;
      quantity: number;
      unit_price: number;
      products:
        | { name: string }
        | { name: string }[]
        | null;
    };

    type ReportOrder = {
      id: string;
      created_at: string;
      recipient_name: string | null;
      order_items: ReportOrderItem[] | null;
    };

    type ReportPayment = {
      id: string;
      order_id: string;
      amount: number;
      method: string;
      paid_at: string | null;
      orders: ReportOrder | ReportOrder[] | null;
    };

    const reportPayments = (payments ?? []) as unknown as ReportPayment[];

    let totalSales = 0;
    let itemsSold = 0;

    const orderIds = new Set<string>();

    const rows = reportPayments.map((payment) => {
      const order = Array.isArray(payment.orders)
        ? payment.orders[0]
        : payment.orders;

      const orderItems = order?.order_items ?? [];

      const itemCount = orderItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      const itemDetails = orderItems.map((item) => {
        const product = Array.isArray(item.products)
          ? item.products[0]
          : item.products;

        return {
          productName: product?.name ?? "Product unavailable",
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unit_price || 0),
          subtotal:
            Number(item.quantity || 0) *
            Number(item.unit_price || 0),
        };
      });

      totalSales += Number(payment.amount || 0);
      itemsSold += itemCount;
      orderIds.add(payment.order_id);

      return {
        paymentId: payment.id,
        orderId: payment.order_id,
        orderDate: order?.created_at ?? null,
        paidAt: payment.paid_at,
        customerName: order?.recipient_name ?? "Customer",
        paymentMethod: payment.method,
        amount: Number(payment.amount || 0),
        itemsSold: itemCount,
        items: itemDetails,
      };
    });

    return res.status(200).json({
      message: "Sales report generated successfully.",
      data: {
        startDate,
        endDate,
        totalSales,
        orderCount: orderIds.size,
        itemsSold,
        rows,
      },
    });
  } catch (error) {
    console.error("Generate sales report error:", error);

    return res.status(500).json({
      message: "Failed to generate sales report.",
    });
  }
};


export const archiveOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    // Find the order and its current status.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, archived_at")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Failed to retrieve order for archiving:", orderError);

      return res.status(500).json({
        message: "Failed to retrieve order.",
      });
    }

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.archived_at) {
      return res.status(409).json({
        message: "This order is already archived.",
      });
    }

    // Only allow archiving orders that are not actively being fulfilled.
    const archivableStatuses = [
      "PENDING_PAYMENT",
      "PAYMENT_FAILED",
      "CANCELLED",
    ];

    if (!archivableStatuses.includes(order.status)) {
      return res.status(409).json({
        message:
          "Only pending, failed-payment, or cancelled orders can be archived.",
      });
    }

    // Never archive an order with a completed payment.
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("id, status")
      .eq("order_id", orderId);

    if (paymentsError) {
      console.error("Failed to check order payments:", paymentsError);

      return res.status(500).json({
        message: "Failed to verify order payments.",
      });
    }

    const hasPaidPayment = (payments ?? []).some(
      (payment) => payment.status === "PAID"
    );

    if (hasPaidPayment) {
      return res.status(409).json({
        message:
          "This order has a completed payment and cannot be archived.",
      });
    }

    // Do not archive an order that already has shipment records.
    const { data: shipments, error: shipmentsError } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", orderId);

    if (shipmentsError) {
      console.error("Failed to check order shipments:", shipmentsError);

      return res.status(500).json({
        message: "Failed to verify order shipments.",
      });
    }

    if (shipments && shipments.length > 0) {
      return res.status(409).json({
        message:
          "This order has shipment records and cannot be archived.",
      });
    }

    // Archive the order without deleting its related records.
    const { data: archivedOrder, error: archiveError } = await supabase
      .from("orders")
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .is("archived_at", null)
      .select("id, archived_at")
      .maybeSingle();

    if (archiveError) {
      console.error("Failed to archive order:", archiveError);

      return res.status(500).json({
        message: "Failed to archive order.",
      });
    }

    if (!archivedOrder) {
      return res.status(409).json({
        message: "The order was already archived or has changed.",
      });
    }

    return res.status(200).json({
      message: "Order archived successfully.",
      data: archivedOrder,
    });
  } catch (error) {
    console.error("Archive order error:", error);

    return res.status(500).json({
      message: "Failed to archive order.",
    });
  }
};


export const restoreOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, archived_at")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Failed to retrieve archived order:", orderError);

      return res.status(500).json({
        message: "Failed to retrieve order.",
      });
    }

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (!order.archived_at) {
      return res.status(409).json({
        message: "This order is not archived.",
      });
    }

    const { data: restoredOrder, error: restoreError } = await supabase
      .from("orders")
      .update({
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .not("archived_at", "is", null)
      .select("id, archived_at")
      .maybeSingle();

    if (restoreError) {
      console.error("Failed to restore order:", restoreError);

      return res.status(500).json({
        message: "Failed to restore order.",
      });
    }

    if (!restoredOrder) {
      return res.status(409).json({
        message: "The order could not be restored.",
      });
    }

    return res.status(200).json({
      message: "Order restored successfully.",
      data: restoredOrder,
    });
  } catch (error) {
    console.error("Restore order error:", error);

    return res.status(500).json({
      message: "Failed to restore order.",
    });
  }
};


export const getArchivedOrders = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        users (
          id,
          email,
          role
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price
        ),
        payments (
          id,
          method,
          amount,
          status,
          payment_type,
          proof_url,
          provider_reference,
          paid_at
        ),
        shipments (
          id,
          courier,
          tracking_number,
          status,
          tracking_url,
          shipped_at,
          delivered_at
        )
      `)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Failed to retrieve archived orders:", error);

      return res.status(500).json({
        message: "Failed to retrieve archived orders.",
      });
    }

    return res.status(200).json({
      message: "Archived orders retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Get archived orders error:", error);

    return res.status(500).json({
      message: "Failed to retrieve archived orders.",
    });
  }
};

