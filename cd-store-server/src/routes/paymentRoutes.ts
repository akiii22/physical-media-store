import { Router } from "express";
import multer from "multer";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

import {
  uploadPaymentProof,
  getPendingPayments,
  verifyPayment,
  rejectPayment,
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


// ============================================================
// ADMIN
// ============================================================

// Get payments waiting for verification
router.get(
  "/pending",
  requireAuth,
  requireAdmin,
  getPendingPayments
);


// Verify payment
router.patch(
  "/:paymentId/verify",
  requireAuth,
  requireAdmin,
  verifyPayment
);


// Reject payment
router.patch(
  "/:paymentId/reject",
   requireAuth,
  requireAdmin,
  rejectPayment
);


export default router;