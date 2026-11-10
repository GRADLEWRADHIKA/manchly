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

  // ── Payments ────────────────────────────────────────────────────────────────
  /**
   * Every transaction across all three products, merged into one feed.
   * Course/webinar/session transactions live in separate tables, so they are
   * fetched in parallel, normalised, then sorted and paged in memory.
   */
  static async getTransactions(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = (req.query.status as string)?.trim().toUpperCase();
      const kind = (req.query.kind as string)?.trim().toLowerCase();

      const statusWhere = status ? { status: status as any } : {};
      const userSelect = { select: { id: true, email: true, name: true } };

      const [courseTx, webinarTx, sessionTx] = await Promise.all([
        kind && kind !== "course" ? [] : prisma.transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: 300,
          select: {
            id: true, amount: true, currency: true, status: true,
            payment_method: true, created_at: true, completed_at: true,
            user: userSelect, course: { select: { id: true, title: true } },
          },
        }),
        kind && kind !== "webinar" ? [] : prisma.webinar_transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: 300,
          select: {
            id: true, amount: true, status: true, created_at: true,
            user: userSelect, webinar: { select: { id: true, title: true } },
          },
        }),
        kind && kind !== "session" ? [] : prisma.session_transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: 300,
          select: { id: true, amount: true, status: true, created_at: true, user_id: true },
        }),
      ]);

      // session_transactions has no user relation in the schema — resolve the
      // names in one query rather than N.
      const sessionUserIds = [...new Set(sessionTx.map((t: any) => t.user_id))];
      const sessionUsers = sessionUserIds.length
        ? await prisma.users.findMany({
            where: { id: { in: sessionUserIds } },
            select: { id: true, email: true, name: true },
          })
        : [];
      const userById = new Map(sessionUsers.map((u) => [u.id, u]));

      const rows = [
        ...courseTx.map((t: any) => ({
          id: t.id, kind: "course", item: t.course?.title ?? "—",
          amount: t.amount, currency: t.currency ?? "INR", status: t.status,
          method: t.payment_method, user: t.user,
          created_at: t.created_at, completed_at: t.completed_at,
        })),
        ...webinarTx.map((t: any) => ({
          id: t.id, kind: "webinar", item: t.webinar?.title ?? "—",
          amount: t.amount, currency: "INR", status: t.status,
          method: null, user: t.user,
          created_at: t.created_at, completed_at: null,
        })),
        ...sessionTx.map((t: any) => ({
          id: t.id, kind: "session", item: "1:1 session",
          amount: t.amount, currency: "INR", status: t.status,
          method: null, user: userById.get(t.user_id) ?? null,
          created_at: t.created_at, completed_at: null,
        })),
      ].sort((a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime());

      const total = rows.length;
      const start = (page - 1) * limit;

      ApiResponseHandler.success(res, {
        transactions: rows.slice(start, start + limit),
        totals: {
          revenue: rows.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + (r.amount || 0), 0),
          success: rows.filter((r) => r.status === "SUCCESS").length,
          pending: rows.filter((r) => r.status === "PENDING").length,
          failed: rows.filter((r) => r.status === "FAILED").length,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, "Transactions retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 1:1 sessions ────────────────────────────────────────────────────────────
  static async getSessions(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = (req.query.status as string)?.trim().toUpperCase();
      const skip = (page - 1) * limit;

      const where: any = status ? { status: status as any } : {};

      const [sessions, total] = await Promise.all([
        prisma.sessions.findMany({
          where, skip, take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.sessions.count({ where }),
      ]);

      // sessions declares no user relations, so resolve both sides in bulk.
      const ids = [...new Set(sessions.flatMap((s) => [s.caller_id, s.receiver_id]))];
      const people = await prisma.users.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      });
      const byId = new Map(people.map((u) => [u.id, u]));

      ApiResponseHandler.success(res, {
        sessions: sessions.map((s) => ({
          ...s,
          caller: byId.get(s.caller_id) ?? null,
          receiver: byId.get(s.receiver_id) ?? null,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, "Sessions retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── KYC ─────────────────────────────────────────────────────────────────────
  static async getKyc(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = (req.query.status as string)?.trim().toUpperCase();
      const skip = (page - 1) * limit;

      const where: any = status ? { status: status as any } : {};

      const [records, total] = await Promise.all([
        prisma.kyc_verifications.findMany({
          where, skip, take: limit,
          orderBy: { created_at: "desc" },
          select: {
            id: true, pan_number: true, status: true, verification_type: true,
            verified_at: true, created_at: true,
            user: { select: { id: true, name: true, email: true, phone: true, kyc_verified: true } },
          },
        }),
        prisma.kyc_verifications.count({ where }),
      ]);

      ApiResponseHandler.success(res, {
        kyc: records,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, "KYC records retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /** Approve or reject a KYC record, keeping the user row in step. */
  static async reviewKyc(req: any, res: Response) {
    const { id } = req.params;
    const approve = req.body?.approve === true;

    try {
      const record = await prisma.kyc_verifications.findUnique({
        where: { id },
        select: { id: true, user_id: true },
      });
      if (!record) {
        return ApiResponseHandler.customError(res, "KYC record not found", 404, "KYC_NOT_FOUND");
      }

      const [updated] = await prisma.$transaction([
        prisma.kyc_verifications.update({
          where: { id },
          data: {
            status: approve ? "VERIFIED" : "FAILED",
            verified_at: approve ? new Date() : null,
          },
        }),
        prisma.users.update({
          where: { id: record.user_id },
          data: {
            kyc_verified: approve,
            kyc_status: approve ? "VERIFIED" : "FAILED",
            kyc_verified_at: approve ? new Date() : null,
          },
        }),
      ]);

      ApiResponseHandler.success(res, { kyc: updated }, `KYC ${approve ? "approved" : "rejected"}`);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── Creator storefronts ─────────────────────────────────────────────────────
  static async getStorefronts(req: any, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string)?.trim();
      const skip = (page - 1) * limit;

      const where: any = { handle: { not: null } };
      if (search) {
        where.OR = [
          { handle: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const [creators, total] = await Promise.all([
        prisma.users.findMany({
          where, skip, take: limit,
          orderBy: { created_at: "desc" },
          select: {
            id: true, name: true, email: true, handle: true,
            storefront: {
              select: {
                is_published: true, tagline: true, accent_color: true,
                view_count: true, updated_at: true,
              },
            },
            _count: { select: { courses: true, webinars: true } },
          },
        }),
        prisma.users.count({ where }),
      ]);

      ApiResponseHandler.success(res, {
        storefronts: creators,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, "Storefronts retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /** Take a storefront public or dark — moderation for abusive pages. */
  static async setStorefrontPublished(req: any, res: Response) {
    const { id } = req.params;
    const publish = req.body?.publish === true;

    try {
      const existing = await prisma.creator_storefronts.findUnique({ where: { user_id: id } });
      if (!existing) {
        return ApiResponseHandler.customError(res, "Storefront not found", 404, "STOREFRONT_NOT_FOUND");
      }

      const storefront = await prisma.creator_storefronts.update({
        where: { user_id: id },
        data: { is_published: publish },
      });

      ApiResponseHandler.success(res, { storefront }, `Storefront ${publish ? "published" : "unpublished"}`);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── Moderation actions on content ───────────────────────────────────────────
  static async setCourseStatus(req: any, res: Response) {
    const { id } = req.params;
    const status = String(req.body?.status || "").toUpperCase();

    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return ApiResponseHandler.customError(res, "Invalid status", 400, "INVALID_STATUS");
    }

    try {
      const course = await prisma.courses.update({
        where: { id },
        data: {
          status: status as any,
          published_at: status === "PUBLISHED" ? new Date() : null,
        },
        select: { id: true, title: true, status: true },
      });
      ApiResponseHandler.success(res, { course }, "Course status updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  static async deleteCourse(req: any, res: Response) {
    try {
      const course = await prisma.courses.findUnique({
        where: { id: req.params.id },
        select: { id: true, title: true },
      });
      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }
      await prisma.courses.delete({ where: { id: course.id } });
      ApiResponseHandler.success(res, course, "Course deleted successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  static async setWebinarStatus(req: any, res: Response) {
    const { id } = req.params;
    const status = String(req.body?.status || "").toUpperCase();

    if (!["DRAFT", "PUBLISHED", "LIVE", "COMPLETED", "CANCELLED"].includes(status)) {
      return ApiResponseHandler.customError(res, "Invalid status", 400, "INVALID_STATUS");
    }

    try {
      const webinar = await prisma.webinars.update({
        where: { id },
        data: { status: status as any },
        select: { id: true, title: true, status: true },
      });
      ApiResponseHandler.success(res, { webinar }, "Webinar status updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  static async deleteWebinar(req: any, res: Response) {
    try {
      const webinar = await prisma.webinars.findUnique({
        where: { id: req.params.id },
        select: { id: true, title: true },
      });
      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }
      await prisma.webinars.delete({ where: { id: webinar.id } });
      ApiResponseHandler.success(res, webinar, "Webinar deleted successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /** Change which roles a user holds. */
  static async setUserRoles(req: any, res: Response) {
    const { id } = req.params;
    const roles: string[] = Array.isArray(req.body?.user_type) ? req.body.user_type : [];
    const valid = ["USER", "CREATOR", "BRAND", "AGENCY", "ADMIN"];

    const normalised = [...new Set(roles.map((r) => String(r).toUpperCase()))];
    if (!normalised.length || normalised.some((r) => !valid.includes(r))) {
      return ApiResponseHandler.customError(res, `Roles must be a non-empty subset of ${valid.join(", ")}`, 400, "INVALID_USER_TYPE");
    }

    // Refuse to strip the last admin, which would lock everyone out of this panel.
    if (!normalised.includes("ADMIN")) {
      const target = await prisma.users.findUnique({ where: { id }, select: { user_type: true } });
      if (target?.user_type?.includes("ADMIN" as any)) {
        const admins = await prisma.users.count({ where: { user_type: { has: "ADMIN" as any } } });
        if (admins <= 1) {
          return ApiResponseHandler.customError(res, "Cannot remove the last admin", 400, "LAST_ADMIN");
        }
      }
    }

    try {
      const user = await prisma.users.update({
        where: { id },
        data: { user_type: normalised as any },
        select: { id: true, email: true, name: true, user_type: true },
      });
      ApiResponseHandler.success(res, { user }, "User roles updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
