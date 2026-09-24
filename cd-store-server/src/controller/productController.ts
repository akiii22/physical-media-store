import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getProducts = async (
  _req: Request,
  res: Response
) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        media_type,
        condition,
        price,
        stock,
        image_url,
        categories (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        message: "Failed to fetch products",
      });
    }

    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        media_type,
        condition,
        price,
        stock,
        image_url,
        categories (
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};