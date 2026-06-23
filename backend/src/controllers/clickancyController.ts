import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";

// Creator whose published catalog drives the xtechmoneymatrix landing page.
// NOTE: the live site now fetches /courses/public?creator_id=<id> directly, so
// this endpoint is a legacy fallback — keep it in sync with the frontend config.
const CLICKANCY_CREATOR_ID = "21ac6faa-d579-44f9-8458-7e995adfa90c"; // Sahmad ansari (xtechnawada@gmail.com)

// Lead course shown in the Hero / PromoVideo. Anything else is rendered as a
// secondary card in the catalog grid.
const CLICKANCY_LEAD_COURSE_ID = "50c4b8ae-fc6e-47e5-97dc-4e33539a3e5e"; // YouTube Automation Blueprint

export class ClickancyController {
  /**
   * GET /clickancy/courses
   * Public endpoint — returns every PUBLISHED course in Harsh's catalog.
   * The lead course (Hero) is placed first; the rest follow newest-first.
   * Shape matches `getPublicCourses` so the existing frontend code works.
   */
  static async getCourses(_req: Request, res: Response) {
    try {
      const courses = await prisma.courses.findMany({
        where: { creator_id: CLICKANCY_CREATOR_ID, status: "PUBLISHED" },
        include: {
          creator: { select: { id: true, name: true, profile_image: true } },
          videos: {
            where: { status: "READY" },
            select: {
              id: true,
              title: true,
              duration: true,
              order: true,
              is_free: true,
              thumbnail_url: true,
            },
            orderBy: { order: "asc" },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { created_at: "desc" },
      });

      // Pin the lead course to the front; keep the rest in newest-first order.
      const lead = courses.find(c => c.id === CLICKANCY_LEAD_COURSE_ID);
      const rest = courses.filter(c => c.id !== CLICKANCY_LEAD_COURSE_ID);
      const ordered = lead ? [lead, ...rest] : courses;

      const publicCourses = ordered.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        thumbnail_url: c.thumbnail_url,
        price: c.price,
        category: c.category,
        tags: c.tags,
        level: c.level,
        language: c.language,
        creator: c.creator,
        total_videos: c.videos.length,
        total_duration: c.videos.reduce((sum, v) => sum + (v.duration || 0), 0),
        total_students: c._count.enrollments,
        videos: c.videos.map(v => ({
          id: v.id,
          title: v.title,
          duration: v.duration,
          order: v.order,
          is_free: v.is_free,
          thumbnail_url: v.thumbnail_url,
        })),
        created_at: c.created_at,
      }));

      return ApiResponseHandler.success(
        res,
        { courses: publicCourses, count: publicCourses.length },
        "Clickancy courses retrieved successfully"
      );
    } catch (err: any) {
      console.error("Clickancy getCourses error:", err);
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
