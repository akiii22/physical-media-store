import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { randomUUID } from "crypto";
import multer from "multer";
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
        ),
        product_images (
          id,
          image_url,
          display_order
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

const uploadProductImage = async (
  file: Express.Multer.File
) => {
  const fileExtension =
    file.originalname.split(".").pop()?.toLowerCase() || "jpg";

  const fileName = `${randomUUID()}.${fileExtension}`;

  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Image upload failed: ${uploadError.message}`
    );
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      description,
      media_type,
      condition,
      price,
      stock,
      category_id,
    } = req.body || {};

    const files = (req.files as Express.Multer.File[]) || [];

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !name ||
      !media_type ||
      !condition ||
      price === undefined ||
      stock === undefined ||
      !category_id
    ) {
      return res.status(400).json({
        message: "Missing required product fields.",
      });
    }

    // ==========================================
    // UPLOAD PRODUCT IMAGES
    // ==========================================

    let imageUrl: string | null = null;

    // First image becomes the existing main image
    if (files.length > 0) {
      imageUrl = await uploadProductImage(files[0]);
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        media_type,
        condition,
        price: Number(price),
        stock: Number(stock),
        category_id,
        image_url: imageUrl,
      })
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
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        message: "Failed to create product.",
      });
    }

    // ==========================================
    // UPLOAD ADDITIONAL IMAGES
    // ==========================================

    if (files.length > 1) {
      const additionalFiles = files.slice(1);

      const imageRecords = [];

      for (let i = 0; i < additionalFiles.length; i++) {
        const uploadedImageUrl = await uploadProductImage(
          additionalFiles[i]
        );

        imageRecords.push({
          product_id: data.id,
          image_url: uploadedImageUrl,
          display_order: i + 2,
        });
      }

      // ==========================================
      // SAVE ADDITIONAL IMAGES
      // ==========================================

      const { error: imageError } = await supabase
        .from("product_images")
        .insert(imageRecords);

      if (imageError) {
        console.error(
          "Product images insert error:",
          imageError
        );

        return res.status(500).json({
          message: "Product created, but additional images failed to save.",
        });
      }
    }

    // ==========================================
    // GET PRODUCT WITH IMAGES
    // ==========================================

    const { data: productWithImages, error: fetchError } =
      await supabase
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
          ),
          product_images (
            id,
            image_url,
            display_order
          )
        `)
        .eq("id", data.id)
        .single();

    if (fetchError) {
      console.error(
        "Failed to fetch created product:",
        fetchError
      );

      return res.status(201).json({
        data,
      });
    }

    return res.status(201).json({
      data: productWithImages,
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      media_type,
      condition,
      price,
      stock,
      category_id,
    } = req.body || {};

    const file = req.file;

    if (
      !name ||
      !media_type ||
      !condition ||
      price === undefined ||
      stock === undefined ||
      !category_id
    ) {
      return res.status(400).json({
        message: "Missing required product fields.",
      });
    }

    const updateData: Record<string, any> = {
      name,
      description: description || null,
      media_type,
      condition,
      price: Number(price),
      stock: Number(stock),
      category_id,
      updated_at: new Date().toISOString(),
    };

    // Only upload a new image if the admin selected one
    if (file) {
      const imageUrl = await uploadProductImage(file);

      updateData.image_url = imageUrl;
    }

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
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
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        message: "Failed to update product.",
      });
    }

    return res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        message: "Failed to delete product.",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};