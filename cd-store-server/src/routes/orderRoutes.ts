
import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updateShipment,
  updateDeliveryFee,
  getSalesReport,
} from "../controller/orderController";
import {
  requireAuth,
  requireAdmin,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();

// Customer checkout
router.post("/", requireAuth, createOrder);

// ADMIN and STAFF: view and manage store orders
router.get(
  "/admin/all",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  getAllOrders
);

router.patch(
  "/:orderId/status",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  updateOrderStatus
);

router.patch(
  "/:orderId/shipment",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  updateShipment
);

// ADMIN only: update delivery fees
router.patch(
  "/admin/:orderId/delivery-fee",
  requireAuth,
  requireAdmin,
  updateDeliveryFee
);

router.get("/admin/sales-reports", requireAuth, requireRole("ADMIN", "STAFF"), getSalesReport); 

// Customers: view their own orders
router.get("/my", requireAuth, getMyOrders);

router.get("/:orderId", requireAuth, getOrderById);

export default router;