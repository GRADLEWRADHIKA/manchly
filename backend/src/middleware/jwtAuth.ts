import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getActiveDevice } from "../lib/redisClient";

dotenv.config();

export interface JWTRequest extends Request {
  user?: { userId: string; email?: string; deviceId?: string };
}

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export async function jwtAuth(req: JWTRequest, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "Missing Authorization header", code: "NO_TOKEN" });
  const match = (auth as string).match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: "Malformed Authorization header", code: "INVALID_TOKEN" });
  const token = match[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const { userId, email, device_id: tokenDeviceId } = payload;

    const incomingDeviceId = tokenDeviceId || (req.headers["x-device-id"] as string);

    // Multi-device session enforcement:
    // If active device in Redis/memory is different from this token's device,
    // reject with 403 DEVICE_CONFLICT
    if (userId && incomingDeviceId) {
      const activeDevice = await getActiveDevice(userId);
      if (activeDevice && activeDevice !== incomingDeviceId) {
        return res.status(403).json({
          success: false,
          code: "DEVICE_CONFLICT",
          message: "Your account is active on another device. Please log in again.",
        });
      }
    }

    req.user = { userId, email, deviceId: incomingDeviceId };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
}
