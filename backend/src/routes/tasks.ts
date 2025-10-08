import express from "express";
import { supabaseAdmin } from "../supabaseClient";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { project_id, title, due_date } = req.body;
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert([{ project_id, title, due_date, created_by: userId }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const projectId = req.query.project_id as string | undefined;
  let query = supabaseAdmin.from("tasks").select("*");
  if (projectId) query = query.eq("project_id", projectId);
  // RLS will filter to allowed rows; here we just return results
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
