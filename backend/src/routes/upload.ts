import express from "express";
import multer from "multer";
import { supabaseAdmin } from "../supabaseClient";
import { jwtAuth } from "../middleware/jwtAuth";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Allow max file size 5 MB
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES }
});

const BUCKET = process.env.SUPABASE_BUCKET || "project-files";

router.post("/", jwtAuth, upload.single("file"), async (req: any, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  // file.size already validated by multer; double-check
  if (file.size > MAX_SIZE_BYTES) return res.status(400).json({ error: "File exceeds 5 MB limit" });

  // create safe filename
  const ext = path.extname(file.originalname) || "";
  const randomName = crypto.randomBytes(12).toString("hex") + ext;
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(randomName, file.buffer, { upsert: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // create signed URL valid 24 hours
    const { data: urlData, error: urlErr } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(randomName, 60 * 60 * 24);
    if (urlErr) return res.status(500).json({ error: urlErr.message });

    res.json({ ok: true, file: data, url: urlData.signedUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
