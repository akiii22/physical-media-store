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
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  createProduct
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  deleteProduct
);

export default router;