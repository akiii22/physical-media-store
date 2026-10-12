import { Request, Response } from "express";
import { supabase } from "../config/supabase";

// GET /api/media-types
export const getMediaTypes = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("media_types")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Get media types error:", error);
      return res.status(500).json({
        message: "Failed to fetch media types.",
      });
    }

    return res.status(200).json({
      message: "Media types fetched successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected get media types error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// POST /api/media-types
export const createMediaType = async (req: Request, res: Response) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({
        message: "Media type name is required.",
      });
    }

    const { data, error } = await supabase
      .from("media_types")
      .insert({ name })
      .select("id, name, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          message: "This media type already exists.",
        });
      }

      console.error("Create media type error:", error);
      return res.status(500).json({
        message: "Failed to create media type.",
      });
    }

    return res.status(201).json({
      message: "Media type created successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected create media type error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// PATCH /api/media-types/:id
export const updateMediaType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({
        message: "Media type name is required.",
      });
    }

    const { data, error } = await supabase
      .from("media_types")
      .update({ name })
      .eq("id", id)
      .select("id, name, created_at")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          message: "This media type already exists.",
        });
      }

      console.error("Update media type error:", error);
      return res.status(500).json({
        message: "Failed to update media type.",
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "Media type not found.",
      });
    }

    return res.status(200).json({
      message: "Media type updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected update media type error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// DELETE /api/media-types/:id
export const deleteMediaType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deletion while products still use this media type.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("media_type", id)
      .limit(1);

    if (productsError) {
      console.error("Check media type usage error:", productsError);
      return res.status(500).json({
        message: "Failed to check whether the media type is in use.",
      });
    }

    if (products?.length) {
      return res.status(409).json({
        message:
          "This media type is assigned to existing products and cannot be deleted.",
      });
    }

    const { data, error } = await supabase
      .from("media_types")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Delete media type error:", error);
      return res.status(500).json({
        message: "Failed to delete media type.",
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "Media type not found.",
      });
    }

    return res.status(200).json({
      message: "Media type deleted successfully.",
    });
  } catch (error) {
    console.error("Unexpected delete media type error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};