import express from "express";
import prisma from "../prismaClient";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Create task
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { project_id, title, due_date } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        project_id,
        title,
        due_date: due_date ? new Date(due_date) : null,
        created_by: userId
      }
    });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create task" });
  }
});

// List tasks (optionally filter by project)
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const projectId = req.query.project_id as string | undefined;
  try {
    const whereClause: any = {};
    if (projectId) whereClause.project_id = projectId;

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.owner_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" }
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch tasks" });
  }
});

export default router;
