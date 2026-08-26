import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JWTRequest } from "./jwtAuth";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Attaches req.user when a valid token is present, and simply continues when it
 * is not. For endpoints that anyone may read but that show a little more to a
 * signed-in viewer — the reel feed marking courses they already own, say.
 *
 * A bad or expired token is treated as "logged out" rather than an error: a
 * public feed should still render for someone whose session lapsed.
 */
export function optionalJwtAuth(req: JWTRequest, _res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  const match = typeof auth === "string" ? auth.match(/^Bearer (.+)$/) : null;
  if (!match) return next();

  try {
    const payload = jwt.verify(match[1], JWT_SECRET) as any;
    req.user = { userId: payload.userId, email: payload.email };
  } catch {
    // Ignored on purpose — the request proceeds as anonymous.
  }
  next();
}
