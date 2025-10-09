import express from "express";
import prisma from "../prismaClient";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// Create project
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        owner_id: userId
      }
    });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create project" });
  }
});

// List projects for the authenticated user
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const projects = await prisma.project.findMany({
      where: { owner_id: userId },
      orderBy: { created_at: "desc" }
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

export default router;
