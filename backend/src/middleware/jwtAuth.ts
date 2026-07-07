import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface JWTRequest extends Request {
  user?: { userId: string; email?: string };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export function jwtAuth(req: JWTRequest, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const match = (auth as string).match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: "Malformed Authorization header" });
  const token = match[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
