import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";
import { isAdmin } from "../utils/userTypeHelper";
import { AdminController } from "../controllers/adminController";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Access token required", code: "UNAUTHORIZED" },
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { message: "Invalid or expired token", code: "FORBIDDEN" },
        timestamp: new Date().toISOString()
      });
    }
    req.user = decoded;

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { user_type: true }
    });

    if (!user || !isAdmin(user.user_type)) {
      return res.status(403).json({
        success: false,
        error: { message: "Admin access required", code: "FORBIDDEN" },
        timestamp: new Date().toISOString()
      });
    }
    next();
  });
};

router.get("/stats", authenticateToken, AdminController.getStats);
router.get("/users", authenticateToken, AdminController.getUsers);
router.delete("/users/:id", authenticateToken, AdminController.deleteUser);
router.get("/courses", authenticateToken, AdminController.getCourses);
router.get("/webinars", authenticateToken, AdminController.getWebinars);

export default router;
