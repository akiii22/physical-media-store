
import { Response } from "express";

import { supabase } from "../config/supabase";

import type { CreateOrderInput } from "../types/order";

import { AuthenticatedRequest } from "../middleware/authMiddleware";

// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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
      !customer_name ||
      !phone ||
      !delivery_method ||
      !payment_method ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required order information.",
      });
    }


    // ----------------------------------------------------------
    // Delivery requires an address
    // ----------------------------------------------------------

    if (
      delivery_method === "DELIVERY" &&
      (!province ||
        !city ||
        !barangay ||
        !street_address)
    ) {
      return res.status(400).json({
        message: "Complete delivery address is required.",
      });
    }


    // ----------------------------------------------------------
    // Validate quantities
    // ----------------------------------------------------------

    for (const item of items) {
      if (
        !item.product_id ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          message: "Invalid order item.",
        });
      }
    }


    // ----------------------------------------------------------
    // Get products from database
    // ----------------------------------------------------------

    const productIds = items.map(
      (item) => item.product_id
    );

    const {
      data: products,
      error: productsError,
    } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        stock
      `)
      .in("id", productIds);


    if (productsError) {
      console.error(productsError);

      return res.status(500).json({
        message: "Failed to retrieve products.",
      });
    }


    if (
      !products ||
      products.length !== productIds.length
    ) {
      return res.status(400).json({
        message: "One or more products no longer exist.",
      });
    }


    // ----------------------------------------------------------
    // Calculate total using database prices
    // ----------------------------------------------------------

    let totalAmount = 0;

    for (const item of items) {
      const product = products.find(
        (product) =>
          product.id === item.product_id
      );


      if (!product) {
        return res.status(400).json({
          message: "Product not found.",
        });
      }


      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock.`,
        });
      }


      totalAmount +=
        Number(product.price) *
        item.quantity;
    }


    // ----------------------------------------------------------
    // Create order
    // ----------------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id,

        status: "PENDING_PAYMENT",

        total_amount: totalAmount,

        delivery_method,

        recipient_name: customer_name,

        phone,

        province:
          delivery_method === "DELIVERY"
            ? province
            : null,

        city:
          delivery_method === "DELIVERY"
            ? city
            : null,

        barangay:
          delivery_method === "DELIVERY"
            ? barangay
            : null,

        street_address:
          delivery_method === "DELIVERY"
            ? street_address
            : null,

        postal_code:
          delivery_method === "DELIVERY"
            ? postal_code || null
            : null,
      })
      .select()
      .single();


    if (orderError) {
      console.error(orderError);

      return res.status(500).json({
        message: "Failed to create order.",
      });
    }


    // ----------------------------------------------------------
    // Create order items
    // ----------------------------------------------------------

    const orderItems = items.map((item) => {
      const product = products.find(
        (product) =>
          product.id === item.product_id
      )!;

      return {
        order_id: order.id,

        product_id: product.id,

        quantity: item.quantity,

        unit_price: product.price,
      };
    });


    const {
      error: orderItemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);


    if (orderItemsError) {
      console.error(orderItemsError);

      return res.status(500).json({
        message: "Failed to create order items.",
      });
    }


    // ----------------------------------------------------------
    // Create pending payment
    // ----------------------------------------------------------

    const {
      error: paymentError,
    } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,

        method: payment_method,

        amount: totalAmount,

        status: "PENDING",
      });


    if (paymentError) {
      console.error(paymentError);

      return res.status(500).json({
        message: "Failed to create payment record.",
      });
    }


    // ----------------------------------------------------------
    // Success response
    // ----------------------------------------------------------

    return res.status(201).json({
      message: "Order created successfully.",

      data: {
        order_id: order.id,

        total_amount: totalAmount,

        status: order.status,
      },
    });

  } catch (error) {

    console.error("Server error:", error);

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

    const { data, error } = await supabase
      .from("orders")
      .select(`
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to retrieve customer orders:", error);

      return res.status(500).json({
        message: "Failed to retrieve your orders.",
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      message: "Failed to retrieve your orders.",
    });
  }
};