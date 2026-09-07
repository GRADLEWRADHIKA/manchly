import { Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isCreator } from "../utils/userTypeHelper";
import { firebaseService } from "../services/FirebaseService";
import { getIO } from "../utils/socketHandler";

export class NotificationController {
  
  static async getCreatorNotifications(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { page = 1, type } = req.query;
      const take = 20;
      const skip = (Number(page) - 1) * take;

      const where: any = { user_id: userId };
      if (type) {
        where.type = String(type).toUpperCase();
      }

      const [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
          where,
          orderBy: { created_at: "desc" },
          take,
          skip,
        }),
        prisma.notifications.count({ where }),
      ]);

      const mapped = notifications.map((n) => ({
        _id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        is_read: n.is_read,
        createdAt: n.created_at.toISOString(),
        data: n.data,
      }));

      ApiResponseHandler.success(
        res,
        mapped,
        "Creator notifications fetched",
        200
      );
    } catch (error: any) {
      ApiResponseHandler.unexpectedError(res, error);
    }
  }

  /**
   * Get notifications for user
   * GET /notifications/user
   */
  static async getUserNotifications(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { page = 1, type } = req.query;
      const take = 20;
      const skip = (Number(page) - 1) * take;

      const where: any = { user_id: userId };
      if (type) {
        where.type = String(type).toUpperCase();
      }

      const [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
          where,
          orderBy: { created_at: "desc" },
          take,
          skip,
        }),
        prisma.notifications.count({ where }),
      ]);

      const mapped = notifications.map((n) => ({
        _id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        is_read: n.is_read,
        createdAt: n.created_at.toISOString(),
        data: n.data,
      }));

      ApiResponseHandler.success(
        res,
        mapped,
        "User notifications fetched",
        200
      );
    } catch (error: any) {
      ApiResponseHandler.unexpectedError(res, error);
    }
  }

  /**
   * Mark a single notification as read
   * PUT /notifications/:id/read
   */
  static async markAsRead(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const notification = await prisma.notifications.findUnique({
        where: { id },
      });

      if (!notification) {
        return ApiResponseHandler.customError(
          res,
          "Notification not found",
          404
        );
      }

      if (notification.user_id !== userId) {
        return ApiResponseHandler.customError(res, "Not authorized", 403);
      }

      await prisma.notifications.update({
        where: { id },
        data: { is_read: true },
      });

      ApiResponseHandler.success(res, {}, "Notification marked as read");
    } catch (error: any) {
      ApiResponseHandler.unexpectedError(res, error);
    }
  }

  /**
   * Mark all notifications as read for the current user
   * PUT /notifications/read-all
   */
  static async markAllAsRead(req: any, res: Response) {
    try {
      const userId = req.user.userId;

      await prisma.notifications.updateMany({
        where: { user_id: userId, is_read: false },
        data: { is_read: true },
      });

      ApiResponseHandler.success(res, {}, "All notifications marked as read");
    } catch (error: any) {
      ApiResponseHandler.unexpectedError(res, error);
    }
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: any, res: Response) {
    try {
      const userId = req.user.userId;

      const count = await prisma.notifications.count({
        where: { user_id: userId, is_read: false },
      });

      ApiResponseHandler.success(res, { count }, "Unread count fetched");
    } catch (error: any) {
      ApiResponseHandler.unexpectedError(res, error);
    }
  }

  /**
   * Create a notification (internal helper — call from other controllers/services)
   * Stores in DB + sends FCM push + emits socket event
   */
  static async createNotification(params: {
    userId: string;
    type: "SALE" | "SESSION" | "WEBINAR" | "COURSE" | "EXPERT" | "SYSTEM";
    title: string;
    message: string;
    data?: any;
  }) {
    const notification = await prisma.notifications.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || undefined,
      },
    });

    const mappedNotification = {
      _id: notification.id,
      type: notification.type.toLowerCase(),
      title: notification.title,
      message: notification.message,
      is_read: false,
      createdAt: notification.created_at.toISOString(),
      data: notification.data,
    };

    // Send real-time socket event
    const io = getIO();
    if (io) {
      io.to(`user_${params.userId}`).emit("new_notification", mappedNotification);
    }

    // Send FCM push notification
    try {
      const user = await prisma.users.findUnique({
        where: { id: params.userId },
        select: { fcm_token: true },
      });

      if (user?.fcm_token) {
        firebaseService.sendPushNotification(user.fcm_token, {
          title: params.title,
          body: params.message,
          type: params.type.toLowerCase(),
          notificationId: notification.id,
          data: params.data ? { payload: JSON.stringify(params.data) } : undefined,
        });
      }
    } catch (error: any) {
      console.error("[NOTIF] Failed to send push:", error.message);
    }

    return notification;
  }
}
