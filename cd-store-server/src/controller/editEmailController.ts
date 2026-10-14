
import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getEmailTemplates = async (
  _req: Request,
  res: Response
) => {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch email templates:", error);
      return res.status(500).json({
        message: "Failed to retrieve email templates.",
      });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Email templates error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const updateEmailTemplate = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { subject, body, is_active } = req.body;

    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof body !== "string" ||
      !body.trim()
    ) {
      return res.status(400).json({
        message: "Subject and body are required.",
      });
    }

    const updates: {
      subject: string;
      body: string;
      updated_at: string;
      is_active?: boolean;
    } = {
      subject: subject.trim(),
      body: body.trim(),
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === "boolean") {
      updates.is_active = is_active;
    }

    const { data, error } = await supabase
      .from("email_templates")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update email template:", error);

      return res.status(500).json({
        message: "Failed to update email template.",
      });
    }

    return res.status(200).json({
      message: "Email template updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Email template update error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
