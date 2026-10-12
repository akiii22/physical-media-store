import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controller/categoryController";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = Router();

// Public: display categories in the storefront.
router.get("/", getCategories);

// Admin only: manage categories.
router.post("/", requireAuth, requireAdmin, createCategory);
router.patch("/:id", requireAuth, requireAdmin, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

export default router;