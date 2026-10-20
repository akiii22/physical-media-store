
import { Router } from "express";

import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from "../middleware/authMiddleware";

import {
  createTeamMember,
  getAllCustomers,
  getAllTeamMembers,
  updateTeamMemberStatus,
  updateMyProfile,
  getMyProfile,
} from "../controller/userController";

const router = Router();

// Admin customers
router.get(
  "/admin/customers",
  requireAuth,
  requireAdmin,
  getAllCustomers
);

// Admin team management
router.post(
  "/admin/team",
  requireAuth,
  requireAdmin,
  createTeamMember
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

// Current user's role
router.get(
  "/me/role",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    if (!req.role) {
      return res.status(403).json({
        message: "Unable to retrieve account role.",
      });
    }

    return res.json({ role: req.role });
  }
);

// Current user's profile
router.get("/me/profile", requireAuth, getMyProfile);

router.patch("/me/profile", requireAuth, updateMyProfile);

export default router;
