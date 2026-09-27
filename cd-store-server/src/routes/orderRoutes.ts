import { requireAuth, requireAdmin } from './../middleware/authMiddleware';
import {Router} from "express";
import { createOrder, getAllOrders, getMyOrders, getOrderById, updateOrderStatus, updateShipment} from "../controller/orderController";

const router = Router();

router.post("/", requireAuth, createOrder);

router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  getAllOrders
);

router.patch(
  "/:orderId/status",
  requireAuth,
  requireAdmin,
  updateOrderStatus
);

router.patch(
  "/:orderId/shipment",
  requireAuth,
  requireAdmin,
  updateShipment
);

router.get(
  "/my",
  requireAuth,
  getMyOrders
);

router.get("/:orderId", requireAuth, getOrderById)

export default router;