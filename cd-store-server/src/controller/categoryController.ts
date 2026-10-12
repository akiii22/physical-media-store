import { Request, Response } from "express";
import { supabase } from "../config/supabase";

// GET /api/categories
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Get categories error:", error);
      return res.status(500).json({
        message: "Failed to fetch categories.",
      });
    }

    return res.status(200).json({
      message: "Categories fetched successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected get categories error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// POST /api/categories
export const createCategory = async (req: Request, res: Response) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const { data: existing, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", name)
      .limit(1);

    if (lookupError) {
      console.error("Category lookup error:", lookupError);
      return res.status(500).json({
        message: "Failed to validate category name.",
      });
    }

    if (existing?.length) {
      return res.status(409).json({
        message: "A category with this name already exists.",
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ name })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("Create category error:", error);
      return res.status(500).json({
        message: "Failed to create category.",
      });
    }

    return res.status(201).json({
      message: "Category created successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected create category error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// PATCH /api/categories/:id
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const { data: existing, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", name)
      .neq("id", id)
      .limit(1);

    if (lookupError) {
      console.error("Category lookup error:", lookupError);
      return res.status(500).json({
        message: "Failed to validate category name.",
      });
    }

    if (existing?.length) {
      return res.status(409).json({
        message: "Another category already uses this name.",
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select("id, name, created_at")
      .maybeSingle();

    if (error) {
      console.error("Update category error:", error);
      return res.status(500).json({
        message: "Failed to update category.",
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      message: "Category updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Unexpected update category error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Do not delete a category assigned to existing products.
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (productsError) {
      console.error("Check category usage error:", productsError);
      return res.status(500).json({
        message: "Failed to check whether the category is in use.",
      });
    }

    if (products?.length) {
      return res.status(409).json({
        message:
          "This category is assigned to existing products and cannot be deleted.",
      });
    }

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Delete category error:", error);
      return res.status(500).json({
        message: "Failed to delete category.",
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Unexpected delete category error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
};