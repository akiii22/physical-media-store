
import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };

  role?: UserRole;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.slice("Bearer ".length);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
    }

    // Retrieve the application user and account status.
    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select("id, email, role, is_active")
      .eq("id", user.id)
      .single();

    if (appUserError || !appUser) {
      return res.status(403).json({
        message: "Application user not found.",
      });
    }

    // Block inactive accounts.
    if (!appUser.is_active) {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact an administrator.",
      });
    }

    const role = appUser.role as UserRole;

    if (!["ADMIN", "STAFF", "CUSTOMER"].includes(role)) {
      return res.status(403).json({
        message: "Invalid user role.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    req.role = role;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Authentication error.",
    });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};

export const requireAdmin = requireRole("ADMIN");
