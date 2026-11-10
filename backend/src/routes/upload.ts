import express from "express";
import multer from "multer";
import { jwtAuth } from "../middleware/jwtAuth";
import { UploadController } from "../controllers/uploadController";
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

router.post("/", jwtAuth, upload.single("file"), UploadController.uploadFile);

export default router;
