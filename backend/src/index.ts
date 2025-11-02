import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import muxRouter from "./routes/mux";
import coursesRouter from "./routes/courses";
import paymentsRouter from "./routes/payments";
import morgan from "morgan";

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
