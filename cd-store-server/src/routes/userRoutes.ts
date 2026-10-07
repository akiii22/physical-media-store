import { Router } from "express";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

import {
  getAllCustomers,
} from "../controller/userController";

const router = Router();

/*
 * ============================================================
 * ADMIN CUSTOMERS
 * ============================================================
 */

router.get(
  "/admin/customers",
  requireAuth,
  requireAdmin,
  getAllCustomers
);

export default router;