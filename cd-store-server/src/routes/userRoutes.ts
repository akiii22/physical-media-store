import { Router } from "express";

import {
  requireAuth,
  requireAdmin,
} from "../middleware/authMiddleware";

import {
  createTeamMember,
  getAllCustomers,
  getAllTeamMembers,
  updateTeamMemberStatus,
  updateMyProfile,
  getMyProfile
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



router.post(
  "/admin/team",
  requireAuth,
  requireAdmin,
  createTeamMember,
);

router.get(
  "/admin/team",
  requireAuth,
  requireAdmin,
  getAllTeamMembers
);

router.patch(
  "/admin/team/:id/status",
  requireAuth,
  requireAdmin,
  updateTeamMemberStatus
);

router.get("/me/profile", requireAuth, getMyProfile);

router.patch("/me/profile", requireAuth, updateMyProfile);

export default router;