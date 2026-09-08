import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { canManageResource } from "../utils/permissions";
import MuxManager from "../utils/MuxManager";
import dotenv from "dotenv";
import { Prisma } from "@prisma/client";

dotenv.config();

const muxManager = new MuxManager({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  timeout: 30000,
});

/** What a viewer needs to decide whether to buy, without leaving the feed. */
const FEED_COURSE_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  thumbnail_url: true,
  thumbnail: true,
  category: true,
  level: true,
  language: true,
  creator: { select: { id: true, name: true, profile_image: true, handle: true } },
  _count: { select: { enrollments: true, videos: true } },
} as const;

export class ReelController {
  // ── Feed ────────────────────────────────────────────────────────────────────
  
 static async getFeed(req: any, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(30, Math.max(1, parseInt(req.query.limit as string) || 10));
  const category = (req.query.category as string)?.trim();
  const seed = String(req.query.seed || "default-seed").slice(0, 64); // NEW
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      status: "READY",
      course: { status: "PUBLISHED", ...(category ? { category } : {}) },
    };

    // NEW: seeded-random order via raw SQL — Prisma can't order by a computed hash directly.
    const categoryFilter = category
      ? Prisma.sql`AND c.category = ${category}`
      : Prisma.empty;

    const idRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT cr.id
      FROM course_reels cr
      JOIN courses c ON c.id = cr.course_id
      WHERE cr.status = 'READY'
        AND c.status = 'PUBLISHED'
        ${categoryFilter}
      ORDER BY md5(cr.id::text || ${seed})
      OFFSET ${skip} LIMIT ${limit}
    `);
    const orderedIds = idRows.map((r) => r.id);

    const [reels, total] = await Promise.all([
      prisma.course_reels.findMany({
        where: { id: { in: orderedIds } },
        select: {
          id: true, caption: true, mux_playback_id: true, playback_url: true,
          thumbnail_url: true, duration: true, view_count: true, created_at: true,
          course: { select: FEED_COURSE_SELECT },
        },
      }),
      prisma.course_reels.count({ where }),
    ]);

    // findMany with `in` does not preserve order — restore the seeded order.
    const byId = new Map(reels.map((r) => [r.id, r]));
    const orderedReels = orderedIds.map((id) => byId.get(id)).filter(Boolean) as typeof reels;

    // Mark which courses this viewer already owns, in one query.
    let enrolledIds = new Set<string>();
    const userId = req.user?.userId;
    if (userId && orderedReels.length) {
      const enrolments = await prisma.enrollments.findMany({
        where: { user_id: userId, course_id: { in: orderedReels.map((r) => r.course.id) } },
        select: { course_id: true },
      });
      enrolledIds = new Set(enrolments.map((e) => e.course_id));
    }

    ApiResponseHandler.success(res, {
      reels: orderedReels.map((r) => ({ ...r, is_enrolled: enrolledIds.has(r.course.id) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, "Reels retrieved successfully");
  } catch (err: any) {
    ApiResponseHandler.unexpectedError(res, err, 500);
  }
}

  /** Bump a view counter. Fire-and-forget from the client's point of view. */
  static async trackView(req: any, res: Response) {
    try {
      await prisma.course_reels.update({
        where: { id: req.params.reelId },
        data: { view_count: { increment: 1 } },
      });
      ApiResponseHandler.success(res, undefined, "View recorded");
    } catch {
      // A missing reel must not surface as an error mid-scroll.
      ApiResponseHandler.success(res, undefined, "View recorded");
    }
  }

  // ── Creator side ────────────────────────────────────────────────────────────
  /** Reels the signed-in creator owns, newest first. */
  static async getMyReels(req: any, res: Response) {
    try {
      const reels = await prisma.course_reels.findMany({
        where: { creator_id: req.user.userId },
        orderBy: { created_at: "desc" },
        select: {
          id: true, caption: true, status: true, thumbnail_url: true,
          mux_playback_id: true, duration: true, view_count: true, created_at: true,
          course: { select: { id: true, title: true, status: true } },
        },
      });
      ApiResponseHandler.success(res, { reels }, "Reels retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Start a reel upload. Returns a Mux direct-upload URL the client PUTs the
   * file to — the same pipeline course videos already use.
   */
  static async createReelUpload(req: any, res: Response) {
    const { courseId } = req.params;
    const { caption = "" } = req.body;
    const userId = req.user.userId;

    try {
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
        select: { id: true, creator_id: true },
      });
      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }
      if (!(await canManageResource(userId, course.creator_id))) {
        return ApiResponseHandler.customError(res, "You don't have permission to add a reel to this course", 403, "FORBIDDEN");
      }

      const upload = await muxManager.createDirectUpload({
        timeout: 3600,
        cors_origin: "*",
        new_asset_settings: { playback_policy: ["public"], mp4_support: "none" },
      });

      const reel = await prisma.course_reels.create({
        data: {
          course_id: courseId,
          creator_id: course.creator_id,
          caption: String(caption).slice(0, 300),
          mux_upload_id: upload.id,
          upload_url: upload.url,
          status: "UPLOADING",
        },
      });

      ApiResponseHandler.success(res, {
        reel,
        upload_url: upload.url,
        upload_id: upload.id,
      }, "Reel upload URL created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Poll Mux for an upload's asset and promote the reel to READY.
   * Mirrors the course-video status endpoint rather than relying on webhooks.
   */
  static async getReelStatus(req: any, res: Response) {
    const { reelId } = req.params;

    try {
      const reel = await prisma.course_reels.findUnique({
        where: { id: reelId },
        select: { id: true, creator_id: true, status: true, mux_upload_id: true, mux_asset_id: true },
      });
      if (!reel) {
        return ApiResponseHandler.customError(res, "Reel not found", 404, "REEL_NOT_FOUND");
      }
      if (!(await canManageResource(req.user.userId, reel.creator_id))) {
        return ApiResponseHandler.customError(res, "You don't have permission to view this reel", 403, "FORBIDDEN");
      }

      if (reel.status === "READY" || !reel.mux_upload_id) {
        return ApiResponseHandler.success(res, { reel }, "Reel status retrieved");
      }

      const upload = await muxManager.getUpload(reel.mux_upload_id);
      if (!upload?.asset_id) {
        return ApiResponseHandler.success(res, { reel }, "Reel still uploading");
      }

      const asset = await muxManager.getAsset(upload.asset_id);
      const playbackId = asset?.playback_ids?.[0]?.id;
      const ready = asset?.status === "ready" && !!playbackId;

      const updated = await prisma.course_reels.update({
        where: { id: reelId },
        data: {
          mux_asset_id: upload.asset_id,
          mux_playback_id: playbackId || null,
          playback_url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
          thumbnail_url: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
          duration: asset?.duration ? Math.round(asset.duration) : null,
          status: ready ? "READY" : asset?.status === "errored" ? "FAILED" : "PROCESSING",
        },
      });

      ApiResponseHandler.success(res, { reel: updated }, "Reel status retrieved");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /** Edit the caption, or hide/show the reel without deleting it. */
  static async updateReel(req: any, res: Response) {
    const { reelId } = req.params;
    const { caption, hidden } = req.body;

    try {
      const reel = await prisma.course_reels.findUnique({
        where: { id: reelId },
        select: { id: true, creator_id: true, status: true },
      });
      if (!reel) {
        return ApiResponseHandler.customError(res, "Reel not found", 404, "REEL_NOT_FOUND");
      }
      if (!(await canManageResource(req.user.userId, reel.creator_id))) {
        return ApiResponseHandler.customError(res, "You don't have permission to edit this reel", 403, "FORBIDDEN");
      }

      const data: any = {};
      if (typeof caption === "string") data.caption = caption.slice(0, 300);
      // Only READY and HIDDEN can be toggled — an upload in flight is left alone.
      if (typeof hidden === "boolean" && (reel.status === "READY" || reel.status === "HIDDEN")) {
        data.status = hidden ? "HIDDEN" : "READY";
      }

      const updated = await prisma.course_reels.update({ where: { id: reelId }, data });
      ApiResponseHandler.success(res, { reel: updated }, "Reel updated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  static async deleteReel(req: any, res: Response) {
    const { reelId } = req.params;

    try {
      const reel = await prisma.course_reels.findUnique({
        where: { id: reelId },
        select: { id: true, creator_id: true, mux_asset_id: true },
      });
      if (!reel) {
        return ApiResponseHandler.customError(res, "Reel not found", 404, "REEL_NOT_FOUND");
      }
      if (!(await canManageResource(req.user.userId, reel.creator_id))) {
        return ApiResponseHandler.customError(res, "You don't have permission to delete this reel", 403, "FORBIDDEN");
      }

      // Drop the Mux asset first so deleting the row cannot orphan storage.
      if (reel.mux_asset_id) {
        await muxManager.deleteAsset(reel.mux_asset_id).catch((e: any) =>
          console.error("Mux reel asset delete failed:", e?.message || e),
        );
      }
      await prisma.course_reels.delete({ where: { id: reelId } });

      ApiResponseHandler.success(res, { id: reelId }, "Reel deleted successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
