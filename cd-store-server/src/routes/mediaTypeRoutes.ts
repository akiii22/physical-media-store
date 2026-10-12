import { Router } from "express";
import {
  getMediaTypes,
  createMediaType,
  updateMediaType,
  deleteMediaType,
} from "../controller/mediaTypeController";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/", getMediaTypes);

router.post("/", requireAuth, requireAdmin, createMediaType);
router.patch("/:id", requireAuth, requireAdmin, updateMediaType);
router.delete("/:id", requireAuth, requireAdmin, deleteMediaType);

export default router;