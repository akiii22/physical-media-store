import { Request, Response } from "express";

import { supabase } from "../config/supabase";

import type { CreateOrderInput } from "../types/order";


// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const body = req.body as CreateOrderInput;

    const {
      user_id,
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
  req: Request,
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