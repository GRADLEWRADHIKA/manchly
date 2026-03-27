import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync } from "fs";
import { existsSync } from "fs";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import muxRouter from "./routes/mux";
import coursesRouter from "./routes/courses";
import paymentsRouter from "./routes/payments";
import webinarsRouter from "./routes/webinars";
import chatRouter from "./routes/chat";
import groupsRouter from "./routes/groups";
import kycRouter from "./routes/kyc";
import adminRouter from "./routes/admin";
import settlementsRouter from "./routes/settlements";
import morgan from "morgan";
import { webinarCleanupService } from "./utils/webinarCleanup";
import { settlementCronService } from "./utils/settlementCron";
import { initializeSocketIO } from "./utils/socketHandler";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// SSL Certificate paths
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || "/etc/letsencrypt/live/server.manchly.com/fullchain.pem";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || "/etc/letsencrypt/live/server.manchly.com/privkey.pem";

// Check if SSL certificates exist
const useHttps = existsSync(SSL_CERT_PATH) && existsSync(SSL_KEY_PATH);

let server;
if (useHttps) {
  const httpsOptions = {
    cert: readFileSync(SSL_CERT_PATH),
    key: readFileSync(SSL_KEY_PATH),
  };
  server = createHttpsServer(httpsOptions, app);
  console.log("🔒 HTTPS enabled with SSL certificates");
} else {
  server = createHttpServer(app);
  console.log("⚠️  HTTPS certificates not found, using HTTP");
}

// Initialize Socket.io
const io = initializeSocketIO(server);

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

app.use(cors());

// Special handling for Razorpay webhooks - needs raw body for signature verification
app.use("/payments/webhook", bodyParser.raw({ type: "application/json" }), paymentsRouter);
app.use("/settlements/webhook/payout", bodyParser.raw({ type: "application/json" }), settlementsRouter);

// Regular JSON parsing for other routes
app.use(bodyParser.json({ limit: "10mb" }));

// Serve static files from public folder (frontend)
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// API root
app.get("/api", (_req, res) => res.json({ ok: true }));

app.use(morgan('dev'));
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/upload", uploadRouter);
app.use("/mux", muxRouter);
app.use("/courses", coursesRouter);
app.use("/payments", paymentsRouter);
app.use("/webinars", webinarsRouter);
app.use("/chat", chatRouter);
app.use("/groups", groupsRouter);
app.use("/kyc", kycRouter);
app.use("/settlements", settlementsRouter);

const listenPort = useHttps ? HTTPS_PORT : PORT;

server.listen(listenPort, () => {
  const protocol = useHttps ? "https" : "http";
  console.log(`🚀 Server running on ${protocol}://0.0.0.0:${listenPort}`);
  console.log(`Socket.IO server initialized`);

  // Start automatic webinar cleanup
  // Runs every hour to mark expired webinars as COMPLETED
  webinarCleanupService.startAutomaticCleanup("0 * * * *");
  console.log("🧹 Webinar cleanup service started");

  // Start T+2 settlement CRON jobs
  settlementCronService.startSettlementCron();
});
