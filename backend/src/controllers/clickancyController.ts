import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";

// The two courses Clickancy showcases on its landing page. Order here matches
// the order they should appear on the site (lead course first).
const CLICKANCY_COURSE_IDS: string[] = [
  "9da05355-1ade-4e4b-8c10-5af58273339b", // YouTube Automation Blueprint (replicated to Harsh's account)
  "f868da2d-9fbc-43c0-9b86-994d8029fcde", // Technical Analysis Course
];

export class ClickancyController {
  /**
   * GET /clickancy/courses
   * Public endpoint — returns the curated Clickancy course catalog (the
   * replicated YouTube Automation Blueprint + the Technical Analysis Course).
   * Shape matches `getPublicCourses` so the existing frontend code works.
   */
  static async getCourses(_req: Request, res: Response) {
    try {
      const courses = await prisma.courses.findMany({
        where: { id: { in: CLICKANCY_COURSE_IDS } },
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
      });

      // Preserve the order declared in CLICKANCY_COURSE_IDS regardless of how
      // findMany returns them.
      const byId = new Map(courses.map(c => [c.id, c]));
      const ordered = CLICKANCY_COURSE_IDS
        .map(id => byId.get(id))
        .filter((c): c is NonNullable<typeof c> => !!c);

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
