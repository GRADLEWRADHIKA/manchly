import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import muxRouter from "./routes/mux";
import coursesRouter from "./routes/courses";
import paymentsRouter from "./routes/payments";
import webinarsRouter from "./routes/webinars";
import morgan from "morgan";
import { webinarCleanupService } from "./utils/webinarCleanup";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

app.use(cors());

// Special handling for Razorpay webhook - needs raw body
app.use("/payments/webhook", bodyParser.raw({ type: "application/json" }), paymentsRouter);

// Regular JSON parsing for other routes
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (_req, res) => res.json({ ok: true }));

app.use(morgan('dev'));
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use("/mux", muxRouter);
app.use("/courses", coursesRouter);
app.use("/payments", paymentsRouter);
app.use("/webinars", webinarsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start automatic webinar cleanup
  // Runs every hour to mark expired webinars as COMPLETED
  webinarCleanupService.startAutomaticCleanup("0 * * * *");
  console.log("🧹 Webinar cleanup service started");
});
