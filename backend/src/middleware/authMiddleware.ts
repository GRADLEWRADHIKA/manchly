import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticatedRequest } from "./auth";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export default function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    return;
  }

  const match = (authHeader as string).match(/^Bearer (.+)$/);
  if (!match) {
    res.status(401).json({ success: false, error: "MALFORMED_AUTH_HEADER" });
    return;
  }

  try {
    const payload = jwt.verify(match[1], JWT_SECRET) as {
      userId?: string;
      sub?: string;
      id?: string;
      email?: string;
    };
    const userId = payload.userId || payload.sub || payload.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "INVALID_TOKEN" });
      return;
    }

    req.user = {
      id: userId,
      userId,
      email: payload.email
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: "INVALID_TOKEN" });
  }
}
