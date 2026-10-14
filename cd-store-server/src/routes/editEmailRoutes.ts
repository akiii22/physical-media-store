
import { Router } from "express";
import {
  getEmailTemplates,
  updateEmailTemplate,
} from "../controller/editEmailController";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getEmailTemplates
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateEmailTemplate
);

export default router;
