import { Response } from "express";

import { supabase } from "../config/supabase";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/*
 * ============================================================
 * GET ALL CUSTOMERS
 * ============================================================
 */

export const getAllCustomers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    /*
     * ----------------------------------------------------------
     * Get customers
     * ----------------------------------------------------------
     */

    const {
      data: users,
      error: usersError,
    } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("role", "CUSTOMER");

    if (usersError) {
      console.error(
        "Failed to retrieve customers:",
        usersError
      );

      return res.status(500).json({
        message: "Failed to retrieve customers.",
      });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "Customers retrieved successfully.",
        data: [],
      });
    }

    /*
     * ----------------------------------------------------------
     * Get orders belonging to these customers
     * ----------------------------------------------------------
     */

    const customerIds = users.map((user) => user.id);

    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          total_amount,
          recipient_name,
          phone,
          status,
          created_at
        `
      )
      .in("user_id", customerIds)
      .order("created_at", {
        ascending: true,
      });

    if (ordersError) {
      console.error(
        "Failed to retrieve customer orders:",
        ordersError
      );

      return res.status(500).json({
        message: "Failed to retrieve customer orders.",
      });
    }

    /*
     * ----------------------------------------------------------
     * Build customer response
     * ----------------------------------------------------------
     */

    const customerData = users.map((user) => {
      const customerOrders =
        orders?.filter(
          (order) => order.user_id === user.id
        ) ?? [];

      /*
       * Use the most recent order to get the customer's
       * name and phone number.
       */

      const latestOrder =
        customerOrders.length > 0
          ? customerOrders[customerOrders.length - 1]
          : null;

      /*
       * Only count orders that are not cancelled.
       */

      const validOrders = customerOrders.filter(
        (order) => order.status !== "CANCELLED"
      );

      /*
       * Calculate total spending from non-cancelled orders.
       */

      const totalSpent = validOrders.reduce(
        (total, order) =>
          total + Number(order.total_amount || 0),
        0
      );

      /*
       * A customer with at least one order is considered
       * active. A customer with no orders is considered new.
       */

      const status =
        customerOrders.length > 0
          ? "Active"
          : "New";

      /*
       * Use the customer's first order as the joined
       * date for now.
       *
       * We are not assuming that the users table has a
       * created_at column.
       */

      const firstOrder =
        customerOrders.length > 0
          ? customerOrders[0]
          : null;

      return {
        id: user.id,
        name:
          latestOrder?.recipient_name ||
          "Customer",
        email: user.email,
        phone:
          latestOrder?.phone ||
          "Not provided",
        orders: customerOrders.length,
        totalSpent,
        status,
        joined: firstOrder?.created_at || null,
      };
    });

    /*
     * ----------------------------------------------------------
     * Return customers
     * ----------------------------------------------------------
     */

    return res.status(200).json({
      message: "Customers retrieved successfully.",
      data: customerData,
    });
  } catch (error) {
    console.error(
      "Get all customers error:",
      error
    );

    return res.status(500).json({
      message: "Failed to retrieve customers.",
    });
  }
};

type TeamRole = "ADMIN" | "STAFF";

export const createTeamMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Verify that the requester is an administrator.
    if (req.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: TeamRole;
    };

    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password ||
      !["ADMIN", "STAFF"].includes(role ?? "")
    ) {
      return res.status(400).json({
        message: "Name, email, password, and a valid team role are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    // Create the Supabase Auth account using the server-side client.
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: normalizedName,
        },
      });

    if (authError || !authData.user) {
      return res.status(400).json({
        message:
          authError?.message ?? "Unable to create authentication account.",
      });
    }

      const authUserId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .update({
        email: normalizedEmail,
        role,
      })
      .eq("id", authUserId)
      .select("id, email, role")
      .single();

    if (profileError || !profile) {
      const { error: rollbackError } =
        await supabase.auth.admin.deleteUser(authUserId);

      if (rollbackError) {
        console.error(
          "Failed to roll back Auth account:",
          rollbackError,
        );
      }

      console.error("Failed to update team profile:", profileError);

      return res.status(500).json({
        message: "Failed to create the team member profile.",
      });
    }

    return res.status(201).json({
      message: "Team member created successfully.",
      data: {
        id: profile.id,
        name: normalizedName,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Create team member error:", error);

    return res.status(500).json({
      message: "Failed to create team member.",
    });
  }
};

/**
 * ============================================================
 * GET ALL TEAM MEMBERS
 * ============================================================
 */
export const getAllTeamMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Only administrators can view team members.
    if (req.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const { data: users, error } = await supabase
  .from("users")
  .select("id, email, role, is_active")
  .in("role", ["ADMIN", "STAFF"])
  .order("email", { ascending: true });

if (error) {
  console.error("Failed to retrieve team members:", error);

  return res.status(500).json({
    message: "Failed to retrieve team members.",
  });
}

const teamMembers = (users ?? []).map((user) => ({
  id: user.id,
  name: "Team Member",
  email: user.email,
  role: user.role,
  is_active: user.is_active,
  createdAt: null,
}));

return res.status(200).json({
  message: "Team members retrieved successfully.",
  data: teamMembers,
});
  } catch (error) {
    console.error("Get all team members error:", error);

    return res.status(500).json({
      message: "Failed to retrieve team members.",
    });
  }
};

/**
 * ============================================================
 * UPDATE TEAM MEMBER STATUS
 * ADMIN ONLY
 * ============================================================
 */
export const updateTeamMemberStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    const { id } = req.params;
    const { is_active } = req.body as {
      is_active?: boolean;
    };

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "is_active must be true or false.",
      });
    }

    // Prevent an administrator from deactivating their own account.
    if (id === req.user?.id && !is_active) {
      return res.status(400).json({
        message: "You cannot deactivate your own account.",
      });
    }

    // Confirm that the target is a team member.
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .in("role", ["ADMIN", "STAFF"])
      .maybeSingle();

    if (targetError) {
      console.error("Failed to retrieve team member:", targetError);

      return res.status(500).json({
        message: "Failed to retrieve team member.",
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        message: "Team member not found.",
      });
    }

    // Prevent deactivating the last active administrator.
    if (targetUser.role === "ADMIN" && !is_active) {
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("is_active", true);

      if (countError) {
        console.error("Failed to count administrators:", countError);

        return res.status(500).json({
          message: "Failed to verify administrator availability.",
        });
      }

      if ((count ?? 0) <= 1) {
        return res.status(400).json({
          message: "The last active administrator cannot be deactivated.",
        });
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ is_active })
      .eq("id", id)
      .select("id, email, role, is_active")
      .single();

    if (updateError || !updatedUser) {
      console.error("Failed to update team member status:", updateError);

      return res.status(500).json({
        message: "Failed to update team member status.",
      });
    }

    return res.status(200).json({
      message: is_active
        ? "Team member reactivated successfully."
        : "Team member deactivated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update team member status error:", error);

    return res.status(500).json({
      message: "Failed to update team member status.",
    });
  }
};


/**
 * ============================================================
 * GET MY CUSTOMER PROFILE
 * CUSTOMER ONLY
 * ============================================================
 */
export const getMyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Customer access required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("id, email, role, full_name, phone")
      .eq("id", req.user.id)
      .eq("role", "CUSTOMER")
      .maybeSingle();

    if (error) {
      console.error("Failed to retrieve customer profile:", error);

      return res.status(500).json({
        message: "Failed to retrieve your profile.",
      });
    }

    if (!profile) {
      return res.status(404).json({
        message: "Customer profile not found.",
      });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Get customer profile error:", error);

    return res.status(500).json({
      message: "Failed to retrieve your profile.",
    });
  }
};

/**
 * ============================================================
 * UPDATE MY CUSTOMER PROFILE
 * CUSTOMER ONLY
 * ============================================================
 */
export const updateMyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (req.role !== "CUSTOMER") {
      return res.status(403).json({
        message: "Customer access required.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { full_name, phone } = req.body as {
      full_name?: unknown;
      phone?: unknown;
    };

    if (typeof full_name !== "string" || !full_name.trim()) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    if (full_name.trim().length > 100) {
      return res.status(400).json({
        message: "Full name must not exceed 100 characters.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Phone number must be a string.",
      });
    }

    const normalizedPhone =
      typeof phone === "string" ? phone.trim() : "";

    if (normalizedPhone.length > 30) {
      return res.status(400).json({
        message: "Phone number must not exceed 30 characters.",
      });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .update({
        full_name: full_name.trim(),
        phone: normalizedPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .eq("role", "CUSTOMER")
      .select("id, email, role, full_name, phone")
      .maybeSingle();

    if (error) {
      console.error("Failed to update customer profile:", error);

      return res.status(500).json({
        message: "Failed to update your profile.",
      });
    }

    if (!profile) {
      return res.status(404).json({
        message: "Customer profile not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update customer profile error:", error);

    return res.status(500).json({
      message: "Failed to update your profile.",
    });
  }
};
