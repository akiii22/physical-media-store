import { Response } from "express";

import { supabase } from "../config/supabase";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/*
 * ============================================================
 * GET ALL CUSTOMERS
 * ============================================================
 */

export const getAllCustomers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    /*
     * ----------------------------------------------------------
     * Get customers
     * ----------------------------------------------------------
     */

    const {
      data: users,
      error: usersError,
    } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("role", "CUSTOMER");

    if (usersError) {
      console.error(
        "Failed to retrieve customers:",
        usersError
      );

      return res.status(500).json({
        message: "Failed to retrieve customers.",
      });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "Customers retrieved successfully.",
        data: [],
      });
    }

    /*
     * ----------------------------------------------------------
     * Get orders belonging to these customers
     * ----------------------------------------------------------
     */

    const customerIds = users.map((user) => user.id);

    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          total_amount,
          recipient_name,
          phone,
          status,
          created_at
        `
      )
      .in("user_id", customerIds)
      .order("created_at", {
        ascending: true,
      });

    if (ordersError) {
      console.error(
        "Failed to retrieve customer orders:",
        ordersError
      );

      return res.status(500).json({
        message: "Failed to retrieve customer orders.",
      });
    }

    /*
     * ----------------------------------------------------------
     * Build customer response
     * ----------------------------------------------------------
     */

    const customerData = users.map((user) => {
      const customerOrders =
        orders?.filter(
          (order) => order.user_id === user.id
        ) ?? [];

      /*
       * Use the most recent order to get the customer's
       * name and phone number.
       */

      const latestOrder =
        customerOrders.length > 0
          ? customerOrders[customerOrders.length - 1]
          : null;

      /*
       * Only count orders that are not cancelled.
       */

      const validOrders = customerOrders.filter(
        (order) => order.status !== "CANCELLED"
      );

      /*
       * Calculate total spending from non-cancelled orders.
       */

      const totalSpent = validOrders.reduce(
        (total, order) =>
          total + Number(order.total_amount || 0),
        0
      );

      /*
       * A customer with at least one order is considered
       * active. A customer with no orders is considered new.
       */

      const status =
        customerOrders.length > 0
          ? "Active"
          : "New";

      /*
       * Use the customer's first order as the joined
       * date for now.
       *
       * We are not assuming that the users table has a
       * created_at column.
       */

      const firstOrder =
        customerOrders.length > 0
          ? customerOrders[0]
          : null;

      return {
        id: user.id,
        name:
          latestOrder?.recipient_name ||
          "Customer",
        email: user.email,
        phone:
          latestOrder?.phone ||
          "Not provided",
        orders: customerOrders.length,
        totalSpent,
        status,
        joined: firstOrder?.created_at || null,
      };
    });

    /*
     * ----------------------------------------------------------
     * Return customers
     * ----------------------------------------------------------
     */

    return res.status(200).json({
      message: "Customers retrieved successfully.",
      data: customerData,
    });
  } catch (error) {
    console.error(
      "Get all customers error:",
      error
    );

    return res.status(500).json({
      message: "Failed to retrieve customers.",
    });
  }
};