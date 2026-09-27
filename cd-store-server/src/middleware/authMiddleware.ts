import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };

  role?: "ADMIN" | "CUSTOMER";
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    if (appUserError || !appUser) {
      return res.status(403).json({
        message: "Application user not found.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    req.role = appUser.role;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Authentication error.",
    });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("AUTH ROLE:", req.role);

  if (req.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};