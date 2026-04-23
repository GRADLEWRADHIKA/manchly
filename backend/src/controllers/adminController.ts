import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";

export class AdminController {
  /**
   * Get dashboard stats (admin only)
   */
  static async getStats(req: any, res: Response) {
    try {
      const [
        totalUsers,
        totalCreators,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalTransactions,
        successTransactions,
        totalWebinars,
        publishedWebinars,
        totalWebinarEnrollments,
        totalRevenue
      ] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { user_type: { has: "CREATOR" } } }),
        prisma.courses.count(),
        prisma.courses.count({ where: { status: "PUBLISHED" } }),
        prisma.enrollments.count(),
        prisma.transactions.count(),
        prisma.transactions.count({ where: { status: "SUCCESS" } }),
        prisma.webinars.count(),
        prisma.webinars.count({ where: { status: "PUBLISHED" } }),
        prisma.webinar_enrollments.count(),
        prisma.transactions.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true }
        })
      ]);

      const webinarRevenue = await prisma.webinar_transactions.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true }
      });

      const revenue = (totalRevenue._sum.amount ?? 0) + (webinarRevenue._sum.amount ?? 0);

      ApiResponseHandler.success(res, {
        users: {
          total: totalUsers,
          creators: totalCreators
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          enrollments: totalEnrollments
        },
        transactions: {
          total: totalTransactions,
          success: successTransactions
        },
        webinars: {
          total: totalWebinars,
          published: publishedWebinars,
          enrollments: totalWebinarEnrollments
        },
        revenue: Math.round(revenue * 100) / 100
      }, "Stats retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get paginated list of users (admin only)
   */
  static async getUsers(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string)?.trim();
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            user_type: true,
            created_at: true,
            last_login: true,
            _count: {
              select: {
                enrollments: true,
                transactions: true,
                courses: true,
                webinars: true
              }
            }
          }
        }),
        prisma.users.count({ where })
      ]);

      ApiResponseHandler.success(res, {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, "Users retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get paginated list of courses (admin only)
   */
  static async getCourses(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string)?.trim();
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.courses.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { enrollments: true, transactions: true, videos: true }
            }
          }
        }),
        prisma.courses.count({ where })
      ]);

      ApiResponseHandler.success(res, {
        courses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, "Courses retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get paginated list of webinars (admin only)
   */
  static async getWebinars(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string)?.trim();
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ];
      }

      const [webinars, total] = await Promise.all([
        prisma.webinars.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { enrollments: true, transactions: true }
            }
          }
        }),
        prisma.webinars.count({ where })
      ]);

      ApiResponseHandler.success(res, {
        webinars,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, "Webinars retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * DELETE /admin/users/:id
   * Permanently remove a user and all cascade-related records (enrollments,
   * transactions, courses they created, etc.). Admin-only. Self-delete is
   * blocked to prevent accidentally locking yourself out of the dashboard.
   */
  static async deleteUser(req: any, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponseHandler.customError(res, "User id is required", 400, "MISSING_ID");
      }
      if (req.user?.userId === id) {
        return ApiResponseHandler.customError(
          res,
          "You cannot delete your own admin account from this panel.",
          400,
          "SELF_DELETE_BLOCKED"
        );
      }

      const user = await prisma.users.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, user_type: true },
      });
      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      await prisma.users.delete({ where: { id } });

      return ApiResponseHandler.success(
        res,
        { id: user.id, email: user.email, name: user.name },
        "User deleted successfully"
      );
    } catch (err: any) {
      console.error("deleteUser error:", err);
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
