import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import projectsRouter from "./routes/projects";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import tasksRouter from "./routes/tasks";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (_req, res) => res.json({ ok: true }));

app.use("/projects", projectsRouter);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);
app.use("/tasks", tasksRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
