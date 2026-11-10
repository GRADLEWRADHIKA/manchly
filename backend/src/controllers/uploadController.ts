import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const BUCKET = process.env.SUPABASE_BUCKET || "project-files";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export class UploadController {
  // Upload single file
  static async uploadFile(req: any, res: Response) {
    const file = req.file;
    const userId = req.user?.userId; // Get user ID from JWT
    
    if (!file) {
      return ApiResponseHandler.customError(res, "No file uploaded", 400, "NO_FILE_UPLOADED");
    }

    // file.size already validated by multer; double-check
    if (file.size > MAX_SIZE_BYTES) {
      return ApiResponseHandler.customError(res, "File exceeds 5 MB limit", 400, "FILE_TOO_LARGE");
    }

    // create safe filename with user prefix
    const ext = path.extname(file.originalname) || "";
    const randomName = `${userId || 'anonymous'}/${crypto.randomBytes(12).toString("hex")}${ext}`;
    
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(randomName, file.buffer, { 
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        return ApiResponseHandler.customError(res, error.message, 500, "UPLOAD_FAILED");
      }

      // get permanent public URL (set bucket to public in Supabase Dashboard)
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(randomName);

      ApiResponseHandler.success(res, {
        file: data,
        url: urlData.publicUrl
      }, "File uploaded successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}