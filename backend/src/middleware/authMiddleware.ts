import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticatedRequest } from "./auth";
import prisma from "../prismaClient";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export default async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
      deviceId?: string;
      userType?: string;
    };
    const userId = payload.userId || payload.sub || payload.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "INVALID_TOKEN" });
      return;
    }

    // Per-device revocation (Feature #2): device-bound tokens are only valid
    // while their device is still registered. Legacy tokens skip this check.
    if (payload.deviceId) {
      // Per-role sessions (Feature #2): match on user_type when present; legacy
      // device-bound tokens (no userType) fall back to a device-id-only match.
      const device = await prisma.user_devices.findFirst({
        where: {
          user_id: userId,
          device_id: payload.deviceId,
          ...(payload.userType && { user_type: payload.userType }),
        },
        select: { id: true },
      });
      if (!device) {
        res.status(401).json({ success: false, error: "DEVICE_REVOKED" });
        return;
      }
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
