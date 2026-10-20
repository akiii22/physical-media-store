import { Router } from "express";
import multer from "multer";

import {
  requireAuth,
  requireAdmin,
  requireRole,
} from "../middleware/authMiddleware";

import {
  uploadPaymentProof,
  getPendingPayments,
  verifyPayment,
  rejectPayment,
  createDeliveryPayment,
  uploadDeliveryPaymentProof,
} from "../controller/paymentController";

const router = Router();


// ============================================================
// MULTER
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


// ============================================================
// CUSTOMER
// ============================================================



// Upload payment proof
router.post(
  "/:orderId/proof",
  upload.single("proof"),
  uploadPaymentProof
);

router.post(
  "/delivery",
  requireAuth,
  createDeliveryPayment
);

router.post(
  "/delivery/:orderId/proof",
  requireAuth,
  upload.single("proof"),
  uploadDeliveryPaymentProof
);


// ============================================================
// ADMIN
// ============================================================


// Get payments waiting for verification
router.get(
  "/pending",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  getPendingPayments
);

// Verify payment
router.patch(
  "/:paymentId/verify",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  verifyPayment
);

// Reject payment
router.patch(
  "/:paymentId/reject",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  rejectPayment
);

export default router;