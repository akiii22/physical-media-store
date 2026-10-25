
import { Router } from "express";
import {
  getActiveAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controller/announcementController";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();

// Public storefront endpoint.
router.get("/active", getActiveAnnouncements);

// Admin and Staff management endpoints.
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  getAllAnnouncements,
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  createAnnouncement,
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  updateAnnouncement,
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  deleteAnnouncement,
);

export default router;
