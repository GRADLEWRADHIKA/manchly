import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseClient";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; [k: string]: any };
}

// Named `authenticate` to match imports in route files
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

  const match = (authHeader as string).match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: "Malformed Authorization header" });

  const token = match[1];

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = { id: data.user.id, email: data.user.email };
    next();
  } catch (err) {
    console.error("auth error", err);
    res.status(500).json({ error: "Auth verification failed" });
  }
}
