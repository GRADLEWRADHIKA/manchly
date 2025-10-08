import express from "express";
import { supabaseAdmin } from "../supabaseClient";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name, description } = req.body;
  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert([{ name, description, owner_id: userId }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("owner_id", userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
