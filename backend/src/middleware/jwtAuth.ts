import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import prisma from "../prismaClient";
dotenv.config();

export interface JWTRequest extends Request {
  user?: { userId: string; email?: string };
}

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export async function jwtAuth(req: JWTRequest, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const match = (auth as string).match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: "Malformed Authorization header" });
  const token = match[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Per-device revocation (Feature #2): device-bound tokens are only valid
    // while their device is still registered. Legacy tokens (no deviceId) skip
    // this check, so existing sessions keep working.
    if (payload.deviceId) {
      const device = await prisma.user_devices.findUnique({
        where: {
          user_id_device_id: { user_id: payload.userId, device_id: payload.deviceId },
        },
        select: { id: true },
      });
      if (!device) {
        return res.status(401).json({ error: "Device access revoked. Please log in again.", code: "DEVICE_REVOKED" });
      }
    }

    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
