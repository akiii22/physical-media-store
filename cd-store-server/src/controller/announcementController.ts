
import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const announcementFields = [
  "id",
  "title",
  "heading",
  "description",
  "image_url",
  "is_active",
  "start_at",
  "end_at",
  "sort_order",
  "created_at",
  "updated_at",
].join(", ");

const isValidDate = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
};

const getScheduleError = (
  startAt: unknown,
  endAt: unknown,
): string | null => {
  if (startAt != null && startAt !== "" && !isValidDate(startAt)) {
    return "Invalid announcement start date.";
  }

  if (endAt != null && endAt !== "" && !isValidDate(endAt)) {
    return "Invalid announcement end date.";
  }

  if (
    startAt &&
    endAt &&
    isValidDate(startAt) &&
    isValidDate(endAt) &&
    new Date(endAt).getTime() <= new Date(startAt).getTime()
  ) {
    return "The end date must be later than the start date.";
  }

  return null;
};

// Public: fetch announcements eligible for display.
export const getActiveAnnouncements = async (
  _req: Request,
  res: Response,
) => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("store_announcements")
      .select(announcementFields)
      .eq("is_active", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gt.${now}`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Get active announcements error:", error);

    return res.status(500).json({
      message: "Failed to fetch announcements.",
    });
  }
};

// Admin and Staff: fetch all announcements.
export const getAllAnnouncements = async (
  _req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { data, error } = await supabase
      .from("store_announcements")
      .select(announcementFields)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Get all announcements error:", error);

    return res.status(500).json({
      message: "Failed to fetch announcements.",
    });
  }
};

// Admin and Staff: create an announcement.
export const createAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const {
      title,
      heading,
      description,
      image_url,
      is_active,
      start_at,
      end_at,
      sort_order,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof heading !== "string" ||
      !heading.trim()
    ) {
      return res.status(400).json({
        message: "Title and heading are required.",
      });
    }

    if (
      description != null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    if (
      image_url != null &&
      image_url !== "" &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid image URL.",
      });
    }

    const scheduleError = getScheduleError(start_at, end_at);

    if (scheduleError) {
      return res.status(400).json({
        message: scheduleError,
      });
    }

    const { data, error } = await supabase
      .from("store_announcements")
      .insert({
        title: title.trim(),
        heading: heading.trim(),
        description: description?.trim() || null,
        image_url:
          typeof image_url === "string" && image_url.trim()
            ? image_url.trim()
            : null,
        is_active: is_active === true,
        start_at: start_at || null,
        end_at: end_at || null,
        sort_order: Number.isInteger(sort_order)
          ? sort_order
          : 0,
      })
      .select(announcementFields)
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error("Create announcement error:", error);

    return res.status(500).json({
      message: "Failed to create announcement.",
    });
  }
};

// Admin and Staff: update an announcement.
export const updateAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const {
      title,
      heading,
      description,
      image_url,
      is_active,
      start_at,
      end_at,
      sort_order,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof heading !== "string" ||
      !heading.trim()
    ) {
      return res.status(400).json({
        message: "Title and heading are required.",
      });
    }

    if (
      description != null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    if (
      image_url != null &&
      image_url !== "" &&
      typeof image_url !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid image URL.",
      });
    }

    const scheduleError = getScheduleError(start_at, end_at);

    if (scheduleError) {
      return res.status(400).json({
        message: scheduleError,
      });
    }

    const { data, error } = await supabase
      .from("store_announcements")
      .update({
        title: title.trim(),
        heading: heading.trim(),
        description: description?.trim() || null,
        image_url:
          typeof image_url === "string" && image_url.trim()
            ? image_url.trim()
            : null,
        is_active: is_active === true,
        start_at: start_at || null,
        end_at: end_at || null,
        sort_order: Number.isInteger(sort_order)
          ? sort_order
          : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(announcementFields)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Announcement not found.",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Update announcement error:", error);

    return res.status(500).json({
      message: "Failed to update announcement.",
    });
  }
};

// Admin and Staff: delete an announcement.
export const deleteAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("store_announcements")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Announcement not found.",
      });
    }

    return res.status(200).json({
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);

    return res.status(500).json({
      message: "Failed to delete announcement.",
    });
  }
};
