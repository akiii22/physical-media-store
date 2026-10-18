import { Router } from "express";
import multer from "multer";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controller/productController";

import {
  requireAuth,
  requireAdmin,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", getProducts);

router.get("/:id", getProductById);

// Admin product management
/* Product management: ADMIN and STAFF */
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  upload.array("images", 5),
  createProduct
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  upload.single("image"),
  updateProduct
);

/* Deletion: ADMIN only */
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  deleteProduct
);

export default router;