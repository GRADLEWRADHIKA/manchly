import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { SettlementService } from "../services/settlementService";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ceiling on a single `?all=true` export, so one click can't pull the table into memory. */
const EXPORT_MAX = 10000;

/**
 * Page window for a list endpoint.
 *
 * `?all=true` turns off paging so the console can export every row that matches
 * the active filters, capped at EXPORT_MAX.
 */
function readPaging(req: any) {
  const all = String(req.query.all ?? "") === "true";
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = all
    ? EXPORT_MAX
    : Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { all, page, limit, skip: all ? 0 : (page - 1) * limit };
}

/** Pagination envelope matching what the dashboard expects. */
function pageInfo(all: boolean, page: number, limit: number, total: number) {
  return {
    page: all ? 1 : page,
    limit,
    total,
    totalPages: all ? 1 : Math.ceil(total / limit),
    truncated: all && total > EXPORT_MAX,
  };
}

/** Trimmed string, or null when the caller sent an empty/absent value. */
function str(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

/** Finite number, or null when unparseable/blank. */
function numOrNull(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Growth as a whole-number percentage of `prev`, clamped for the empty case. */
function growthPct(current: number, prev: number): number {
  if (prev <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

export class AdminController {
  /**
   * Get dashboard stats (admin only)
   *
   * Powers the Overview screen: user mix, content counts split by state,
   * 1:1 session activity, and revenue broken down per product line with the
   * platform commission each line earned.
   */
  static async getStats(req: any, res: Response) {
    try {
      const now = new Date();
      const DAY = 24 * 60 * 60 * 1000;
      const d30 = new Date(now.getTime() - 30 * DAY);
      const d60 = new Date(now.getTime() - 60 * DAY);
      const last30 = { created_at: { gte: d30 } };
      const prev30 = { created_at: { gte: d60, lt: d30 } };

      // A creator may also carry USER, so "regular" means USER without either
      // of the elevated roles — otherwise the four cards would double-count.
      const regularWhere = {
        user_type: { has: "USER" as any },
        NOT: [{ user_type: { has: "CREATOR" as any } }, { user_type: { has: "AGENCY" as any } }],
      };
      const creatorWhere = { user_type: { has: "CREATOR" as any } };
      const agencyWhere = { user_type: { has: "AGENCY" as any } };

      // Grouped rather than one 25-wide Promise.all so we never ask for more
      // connections than the Prisma pool allows.
      const [totalUsers, totalCreators, totalAgencies, regularUsers] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: creatorWhere }),
        prisma.users.count({ where: agencyWhere }),
        prisma.users.count({ where: regularWhere }),
      ]);

      const [uNow, uPrev, cNow, cPrev, rNow, rPrev, aNow, aPrev] = await Promise.all([
        prisma.users.count({ where: last30 }),
        prisma.users.count({ where: prev30 }),
        prisma.users.count({ where: { ...creatorWhere, ...last30 } }),
        prisma.users.count({ where: { ...creatorWhere, ...prev30 } }),
        prisma.users.count({ where: { ...regularWhere, ...last30 } }),
        prisma.users.count({ where: { ...regularWhere, ...prev30 } }),
        prisma.users.count({ where: { ...agencyWhere, ...last30 } }),
        prisma.users.count({ where: { ...agencyWhere, ...prev30 } }),
      ]);

      const [totalCourses, publishedCourses, draftCourses, totalEnrollments] = await Promise.all([
        prisma.courses.count(),
        prisma.courses.count({ where: { status: "PUBLISHED" } }),
        prisma.courses.count({ where: { status: "DRAFT" } }),
        prisma.enrollments.count(),
      ]);

      const [totalWebinars, publishedWebinars, draftWebinars, completedWebinars, totalWebinarEnrollments] =
        await Promise.all([
          prisma.webinars.count(),
          prisma.webinars.count({ where: { status: "PUBLISHED" } }),
          prisma.webinars.count({ where: { status: "DRAFT" } }),
          prisma.webinars.count({ where: { status: "COMPLETED" } }),
          prisma.webinar_enrollments.count(),
        ]);

      const [totalSessions, completedSessions, upcomingSessions, cancelledSessions] = await Promise.all([
        prisma.sessions.count(),
        prisma.sessions.count({ where: { status: "COMPLETED" } }),
        prisma.sessions.count({ where: { status: { in: ["PENDING", "ACTIVE"] as any } } }),
        prisma.sessions.count({ where: { status: { in: ["CANCELLED", "MISSED"] as any } } }),
      ]);

      const [totalTransactions, successTransactions, courseAgg, webinarAgg, sessionAgg] = await Promise.all([
        prisma.transactions.count(),
        prisma.transactions.count({ where: { status: "SUCCESS" } }),
        prisma.transactions.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
        prisma.webinar_transactions.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
        prisma.session_transactions.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
      ]);

      const courseRevenue = courseAgg._sum.amount ?? 0;
      const webinarRevenue = webinarAgg._sum.amount ?? 0;
      const sessionRevenue = sessionAgg._sum.amount ?? 0;
      const revenue = courseRevenue + webinarRevenue + sessionRevenue;

      // Aggregate commission uses the platform default. Per-creator negotiated
      // rates are applied on the individual rows in getTransactions.
      const pct = SettlementService.getCommissionPercent("");
      const commissionOf = (amount: number) => round2((amount * pct) / 100);

      ApiResponseHandler.success(res, {
        users: {
          total: totalUsers,
          creators: totalCreators,
          regular: regularUsers,
          agencies: totalAgencies,
          growth: {
            total: growthPct(uNow, uPrev),
            creators: growthPct(cNow, cPrev),
            regular: growthPct(rNow, rPrev),
            agencies: growthPct(aNow, aPrev),
          },
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
          enrollments: totalEnrollments,
        },
        transactions: {
          total: totalTransactions,
          success: successTransactions,
        },
        webinars: {
          total: totalWebinars,
          published: publishedWebinars,
          draft: draftWebinars,
          completed: completedWebinars,
          enrollments: totalWebinarEnrollments,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          upcoming: upcomingSessions,
          cancelled: cancelledSessions,
        },
        // Kept as a plain number for any existing consumer; the split lives
        // alongside it under `earnings`.
        revenue: round2(revenue),
        earnings: {
          commission_percent: pct,
          courses: { revenue: round2(courseRevenue), commission: commissionOf(courseRevenue) },
          webinars: { revenue: round2(webinarRevenue), commission: commissionOf(webinarRevenue) },
          sessions: { revenue: round2(sessionRevenue), commission: commissionOf(sessionRevenue) },
          total: { revenue: round2(revenue), commission: commissionOf(revenue) },
        },
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
      const { all, page, limit, skip } = readPaging(req);
      const search = (req.query.search as string)?.trim();
      const type = (req.query.type as string)?.trim().toUpperCase();

      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } }
        ];
      }
      // "USER" means a plain user — someone who is neither a creator nor an
      // agency — so the tab counts line up with the Overview cards.
      if (type === "USER") {
        where.user_type = { has: "USER" };
        where.NOT = [{ user_type: { has: "CREATOR" } }, { user_type: { has: "AGENCY" } }];
      } else if (type === "CREATOR" || type === "AGENCY" || type === "ADMIN" || type === "BRAND") {
        where.user_type = { has: type };
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
        pagination: pageInfo(all, page, limit, total)
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
      const { all, page, limit, skip } = readPaging(req);
      const search = (req.query.search as string)?.trim();
      const status = (req.query.status as string)?.trim().toUpperCase();

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ];
      }
      if (status === "PUBLISHED" || status === "DRAFT" || status === "ARCHIVED") {
        where.status = status;
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

      // Earned revenue per course, in one grouped query rather than N.
      const courseIds = courses.map((c) => c.id);
      const revenueRows = courseIds.length
        ? await prisma.transactions.groupBy({
            by: ["course_id"],
            where: { status: "SUCCESS", course_id: { in: courseIds } },
            _sum: { amount: true },
          })
        : [];
      const revenueById = new Map(revenueRows.map((r) => [r.course_id, r._sum.amount ?? 0]));

      ApiResponseHandler.success(res, {
        courses: courses.map((c) => ({ ...c, revenue: round2(revenueById.get(c.id) ?? 0) })),
        pagination: pageInfo(all, page, limit, total)
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
      const { all, page, limit, skip } = readPaging(req);
      const search = (req.query.search as string)?.trim();
      const status = (req.query.status as string)?.trim().toUpperCase();

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } }
        ];
      }
      if (status === "PUBLISHED" || status === "DRAFT" || status === "COMPLETED" || status === "CANCELLED") {
        where.status = status;
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
        pagination: pageInfo(all, page, limit, total)
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
      const { all, page, limit, skip } = readPaging(req);
      const status = (req.query.status as string)?.trim().toUpperCase();
      const kind = (req.query.kind as string)?.trim().toLowerCase();

      const statusWhere = status ? { status: status as any } : {};
      const userSelect = { select: { id: true, email: true, name: true } };

      const creatorSelect = { select: { id: true, name: true, email: true } };

      // The three tables are merged and sorted in memory, so each side is capped.
      // An export needs the whole set; a page view only needs a deep-enough slice.
      const fetchCap = all ? EXPORT_MAX : 300;

      const [courseTx, webinarTx, sessionTx] = await Promise.all([
        kind && kind !== "course" ? [] : prisma.transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: fetchCap,
          select: {
            id: true, amount: true, currency: true, status: true,
            payment_method: true, created_at: true, completed_at: true,
            user: userSelect,
            course: { select: { id: true, title: true, creator: creatorSelect } },
          },
        }),
        kind && kind !== "webinar" ? [] : prisma.webinar_transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: fetchCap,
          select: {
            id: true, amount: true, status: true, created_at: true,
            user: userSelect,
            webinar: { select: { id: true, title: true, creator: creatorSelect } },
          },
        }),
        kind && kind !== "session" ? [] : prisma.session_transactions.findMany({
          where: statusWhere,
          orderBy: { created_at: "desc" },
          take: fetchCap,
          select: {
            id: true, amount: true, status: true, created_at: true,
            user_id: true, expert_id: true,
          },
        }),
      ]);

      // session_transactions has no user or expert relation in the schema —
      // resolve both sides in one query rather than N.
      const sessionPersonIds = [
        ...new Set(sessionTx.flatMap((t: any) => [t.user_id, t.expert_id]).filter(Boolean)),
      ];
      const sessionPeople = sessionPersonIds.length
        ? await prisma.users.findMany({
            where: { id: { in: sessionPersonIds } },
            select: { id: true, email: true, name: true },
          })
        : [];
      const userById = new Map(sessionPeople.map((u) => [u.id, u]));

      /** Platform's cut of one sale, at the selling creator's negotiated rate. */
      const commissionFor = (amount: number, creatorId?: string | null) =>
        round2(((amount || 0) * SettlementService.getCommissionPercent(creatorId ?? "")) / 100);

      const rows = [
        ...courseTx.map((t: any) => ({
          id: t.id, kind: "course", item: t.course?.title ?? "—",
          amount: t.amount, currency: t.currency ?? "INR", status: t.status,
          method: t.payment_method, user: t.user,
          creator: t.course?.creator ?? null,
          commission: commissionFor(t.amount, t.course?.creator?.id),
          created_at: t.created_at, completed_at: t.completed_at,
        })),
        ...webinarTx.map((t: any) => ({
          id: t.id, kind: "webinar", item: t.webinar?.title ?? "—",
          amount: t.amount, currency: "INR", status: t.status,
          method: null, user: t.user,
          creator: t.webinar?.creator ?? null,
          commission: commissionFor(t.amount, t.webinar?.creator?.id),
          created_at: t.created_at, completed_at: null,
        })),
        ...sessionTx.map((t: any) => ({
          id: t.id, kind: "session", item: "1:1 session",
          amount: t.amount, currency: "INR", status: t.status,
          method: null, user: userById.get(t.user_id) ?? null,
          creator: userById.get(t.expert_id) ?? null,
          commission: commissionFor(t.amount, t.expert_id),
          created_at: t.created_at, completed_at: null,
        })),
      ].sort((a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime());

      const total = rows.length;
      const start = (page - 1) * limit;

      ApiResponseHandler.success(res, {
        transactions: rows.slice(start, start + limit),
        totals: {
          revenue: round2(rows.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + (r.amount || 0), 0)),
          commission: round2(rows.filter((r) => r.status === "SUCCESS").reduce((s, r) => s + (r.commission || 0), 0)),
          success: rows.filter((r) => r.status === "SUCCESS").length,
          pending: rows.filter((r) => r.status === "PENDING").length,
          failed: rows.filter((r) => r.status === "FAILED").length,
        },
        pagination: pageInfo(all, page, limit, total),
      }, "Transactions retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 1:1 sessions ────────────────────────────────────────────────────────────
  static async getSessions(req: any, res: Response) {
    try {
      const { all, page, limit, skip } = readPaging(req);
      const status = (req.query.status as string)?.trim().toUpperCase();

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
        pagination: pageInfo(all, page, limit, total),
      }, "Sessions retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── KYC ─────────────────────────────────────────────────────────────────────
  static async getKyc(req: any, res: Response) {
    try {
      const { all, page, limit, skip } = readPaging(req);
      const status = (req.query.status as string)?.trim().toUpperCase();

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
        pagination: pageInfo(all, page, limit, total),
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
      const { all, page, limit, skip } = readPaging(req);
      const search = (req.query.search as string)?.trim();

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
        pagination: pageInfo(all, page, limit, total),
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

  // ── Full edit ───────────────────────────────────────────────────────────────
  //
  // These accept a partial body: only keys actually present are written, so the
  // console can send just the fields the admin touched.

  /**
   * PATCH /admin/users/:id
   * Edit name, phone, email and roles in one call.
   *
   * Email is the login identity and the OTP destination — changing it moves
   * account access to the new address, so it is validated and uniqueness-checked
   * before the write.
   */
  static async updateUser(req: any, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};
    const data: any = {};

    try {
      const target = await prisma.users.findUnique({
        where: { id },
        select: { id: true, user_type: true },
      });
      if (!target) return ApiResponseHandler.customError(res, "User not found", 404, "NOT_FOUND");

      if ("name" in body) {
        data.name = str(body.name);
      }

      if ("phone" in body) {
        const phone = str(body.phone);
        if (phone) {
          const clash = await prisma.users.findFirst({
            where: { phone, NOT: { id } },
            select: { id: true },
          });
          if (clash) {
            return ApiResponseHandler.customError(res, "Another account already uses that phone number", 409, "PHONE_TAKEN");
          }
        }
        data.phone = phone;
      }

      if ("email" in body) {
        const email = str(body.email)?.toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return ApiResponseHandler.customError(res, "A valid email is required", 400, "INVALID_EMAIL");
        }
        const clash = await prisma.users.findFirst({
          where: { email, NOT: { id } },
          select: { id: true },
        });
        if (clash) {
          return ApiResponseHandler.customError(res, "Another account already uses that email", 409, "EMAIL_TAKEN");
        }
        data.email = email;
      }

      if ("user_type" in body) {
        const roles = Array.isArray(body.user_type) ? body.user_type : [];
        const valid = ["USER", "CREATOR", "BRAND", "AGENCY", "ADMIN"];
        const normalised = [...new Set(roles.map((r: any) => String(r).toUpperCase()))];

        if (!normalised.length || normalised.some((r) => !valid.includes(r as string))) {
          return ApiResponseHandler.customError(res, `Roles must be a non-empty subset of ${valid.join(", ")}`, 400, "INVALID_USER_TYPE");
        }
        // Refuse to strip the last admin, which would lock everyone out.
        if (!normalised.includes("ADMIN") && target.user_type?.includes("ADMIN" as any)) {
          const admins = await prisma.users.count({ where: { user_type: { has: "ADMIN" as any } } });
          if (admins <= 1) {
            return ApiResponseHandler.customError(res, "Cannot remove the last admin", 400, "LAST_ADMIN");
          }
        }
        data.user_type = normalised as any;
      }

      if (!Object.keys(data).length) {
        return ApiResponseHandler.customError(res, "Nothing to update", 400, "NO_CHANGES");
      }

      const user = await prisma.users.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, phone: true, user_type: true },
      });
      ApiResponseHandler.success(res, { user }, "User updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * PATCH /admin/courses/:id
   *
   * `creator_id` reassigns the course. Past transactions keep pointing at the
   * course, so historical revenue follows it to the new owner while already
   * settled payouts stay with the old one — reassign deliberately.
   */
  static async updateCourse(req: any, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};
    const data: any = {};

    try {
      if ("title" in body) {
        const title = str(body.title);
        if (!title) return ApiResponseHandler.customError(res, "Title cannot be empty", 400, "INVALID_TITLE");
        data.title = title;
      }
      if ("description" in body) data.description = str(body.description);
      if ("category" in body) data.category = str(body.category);
      if ("level" in body) data.level = str(body.level);
      if ("language" in body) data.language = str(body.language);
      if ("thumbnail_url" in body) data.thumbnail_url = str(body.thumbnail_url);

      if ("price" in body) {
        const price = numOrNull(body.price);
        if (price === null || price < 0) {
          return ApiResponseHandler.customError(res, "Price must be zero or more", 400, "INVALID_PRICE");
        }
        data.price = price;
      }

      if ("duration" in body) {
        const duration = numOrNull(body.duration);
        if (duration !== null && duration < 0) {
          return ApiResponseHandler.customError(res, "Duration must be zero or more", 400, "INVALID_DURATION");
        }
        data.duration = duration === null ? null : Math.round(duration);
      }

      if ("status" in body) {
        const status = String(body.status || "").toUpperCase();
        if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
          return ApiResponseHandler.customError(res, "Invalid status", 400, "INVALID_STATUS");
        }
        data.status = status as any;
        data.published_at = status === "PUBLISHED" ? new Date() : null;
      }

      if ("creator_id" in body) {
        const creatorId = str(body.creator_id);
        if (!creatorId) return ApiResponseHandler.customError(res, "creator_id cannot be empty", 400, "INVALID_CREATOR");
        const creator = await prisma.users.findUnique({
          where: { id: creatorId },
          select: { id: true, user_type: true },
        });
        if (!creator) return ApiResponseHandler.customError(res, "That creator does not exist", 404, "CREATOR_NOT_FOUND");
        if (!creator.user_type?.includes("CREATOR" as any)) {
          return ApiResponseHandler.customError(res, "Target account is not a creator — grant the role first", 400, "NOT_A_CREATOR");
        }
        data.creator_id = creatorId;
      }

      if (!Object.keys(data).length) {
        return ApiResponseHandler.customError(res, "Nothing to update", 400, "NO_CHANGES");
      }

      const course = await prisma.courses.update({
        where: { id },
        data,
        select: { id: true, title: true, status: true, price: true, creator_id: true },
      });
      ApiResponseHandler.success(res, { course }, "Course updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * PATCH /admin/webinars/:id
   * Same shape as updateCourse, plus the scheduling fields.
   */
  static async updateWebinar(req: any, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};
    const data: any = {};

    try {
      if ("title" in body) {
        const title = str(body.title);
        if (!title) return ApiResponseHandler.customError(res, "Title cannot be empty", 400, "INVALID_TITLE");
        data.title = title;
      }
      if ("description" in body) data.description = str(body.description);
      if ("category" in body) data.category = str(body.category);
      if ("timezone" in body) data.timezone = str(body.timezone);
      if ("thumbnail_url" in body) data.thumbnail_url = str(body.thumbnail_url);

      if ("price" in body) {
        const price = numOrNull(body.price);
        if (price === null || price < 0) {
          return ApiResponseHandler.customError(res, "Price must be zero or more", 400, "INVALID_PRICE");
        }
        data.price = price;
      }

      if ("duration" in body) {
        const duration = numOrNull(body.duration);
        if (duration !== null && duration < 0) {
          return ApiResponseHandler.customError(res, "Duration must be zero or more", 400, "INVALID_DURATION");
        }
        data.duration = duration === null ? null : Math.round(duration);
      }

      if ("max_participants" in body) {
        const cap = numOrNull(body.max_participants);
        data.max_participants = cap === null ? null : Math.max(0, Math.round(cap));
      }

      if ("scheduled_at" in body) {
        const when = new Date(body.scheduled_at);
        if (isNaN(when.getTime())) {
          return ApiResponseHandler.customError(res, "scheduled_at is not a valid date", 400, "INVALID_DATE");
        }
        data.scheduled_at = when;
      }

      if ("status" in body) {
        const status = String(body.status || "").toUpperCase();
        if (!["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"].includes(status)) {
          return ApiResponseHandler.customError(res, "Invalid status", 400, "INVALID_STATUS");
        }
        data.status = status as any;
      }

      if ("creator_id" in body) {
        const creatorId = str(body.creator_id);
        if (!creatorId) return ApiResponseHandler.customError(res, "creator_id cannot be empty", 400, "INVALID_CREATOR");
        const creator = await prisma.users.findUnique({
          where: { id: creatorId },
          select: { id: true, user_type: true },
        });
        if (!creator) return ApiResponseHandler.customError(res, "That creator does not exist", 404, "CREATOR_NOT_FOUND");
        if (!creator.user_type?.includes("CREATOR" as any)) {
          return ApiResponseHandler.customError(res, "Target account is not a creator — grant the role first", 400, "NOT_A_CREATOR");
        }
        data.creator_id = creatorId;
      }

      if (!Object.keys(data).length) {
        return ApiResponseHandler.customError(res, "Nothing to update", 400, "NO_CHANGES");
      }

      const webinar = await prisma.webinars.update({
        where: { id },
        data,
        select: { id: true, title: true, status: true, price: true, scheduled_at: true, creator_id: true },
      });
      ApiResponseHandler.success(res, { webinar }, "Webinar updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * PATCH /admin/sessions/:id
   *
   * `amount` and `duration` are what settlement pays the expert on, so editing
   * them here can leave the session disagreeing with its own transaction row.
   * The response reports the linked transaction total so the console can warn.
   */
  static async updateSession(req: any, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};
    const data: any = {};

    try {
      if ("status" in body) {
        const status = String(body.status || "").toUpperCase();
        if (!["PENDING", "ACTIVE", "COMPLETED", "MISSED", "CANCELLED"].includes(status)) {
          return ApiResponseHandler.customError(res, "Invalid status", 400, "INVALID_STATUS");
        }
        data.status = status as any;
      }

      if ("mode" in body) {
        const mode = String(body.mode || "").toUpperCase();
        if (!["CALL", "VIDEO"].includes(mode)) {
          return ApiResponseHandler.customError(res, "Mode must be CALL or VIDEO", 400, "INVALID_MODE");
        }
        data.mode = mode as any;
      }

      if ("scheduled_at" in body) {
        if (body.scheduled_at === null || body.scheduled_at === "") {
          data.scheduled_at = null;
        } else {
          const when = new Date(body.scheduled_at);
          if (isNaN(when.getTime())) {
            return ApiResponseHandler.customError(res, "scheduled_at is not a valid date", 400, "INVALID_DATE");
          }
          data.scheduled_at = when;
        }
      }

      if ("amount" in body) {
        const amount = numOrNull(body.amount);
        if (amount === null || amount < 0) {
          return ApiResponseHandler.customError(res, "Amount must be zero or more", 400, "INVALID_AMOUNT");
        }
        data.amount = amount;
      }

      if ("duration" in body) {
        const duration = numOrNull(body.duration);
        if (duration === null || duration < 0) {
          return ApiResponseHandler.customError(res, "Duration must be zero or more", 400, "INVALID_DURATION");
        }
        data.duration = Math.round(duration);
      }

      if ("rate_per_min" in body) {
        const rate = numOrNull(body.rate_per_min);
        if (rate === null || rate < 0) {
          return ApiResponseHandler.customError(res, "Rate must be zero or more", 400, "INVALID_RATE");
        }
        data.rate_per_min = rate;
      }

      if (!Object.keys(data).length) {
        return ApiResponseHandler.customError(res, "Nothing to update", 400, "NO_CHANGES");
      }

      const session = await prisma.sessions.update({ where: { id }, data });

      // Surface any drift the admin just introduced against the money actually taken.
      const paid = await prisma.session_transactions.aggregate({
        where: { session_id: id, status: "SUCCESS" },
        _sum: { amount: true },
      });
      const paidTotal = paid._sum.amount ?? 0;

      ApiResponseHandler.success(res, {
        session,
        paid_total: round2(paidTotal),
        amount_mismatch: round2(Math.abs((session.amount ?? 0) - paidTotal)) > 0.01,
      }, "Session updated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * DELETE /admin/sessions/:id
   * `sessions` has no cascade to session_transactions, so the payment rows are
   * removed explicitly rather than left orphaned.
   */
  static async deleteSession(req: any, res: Response) {
    const { id } = req.params;
    try {
      const session = await prisma.sessions.findUnique({ where: { id }, select: { id: true } });
      if (!session) return ApiResponseHandler.customError(res, "Session not found", 404, "NOT_FOUND");

      const [payments] = await prisma.$transaction([
        prisma.session_transactions.deleteMany({ where: { session_id: id } }),
        prisma.sessions.delete({ where: { id } }),
      ]);

      ApiResponseHandler.success(res, {
        id,
        transactions_removed: payments.count,
      }, "Session deleted");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
