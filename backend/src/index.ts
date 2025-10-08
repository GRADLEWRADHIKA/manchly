import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import morgan from "morgan";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (_req, res) => res.json({ ok: true }));

app.use("/projects", projectsRouter);
app.use("/tasks", tasksRouter);
app.use(morgan('dev'));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
