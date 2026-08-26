import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import {
  validateHandle,
  validateHandleFormat,
  HANDLE_MESSAGES,
  generateUniqueHandle,
} from "../utils/handle";

/** Fields safe to expose on a public page. Never widen this without thinking. */
const PUBLIC_CREATOR_SELECT = {
  id: true,
  name: true,
  handle: true,
  profile_image: true,
  instagram_link: true,
  linkedin_link: true,
  youtube_link: true,
  facebook_link: true,
} as const;

/** Load a published storefront by handle, or null. */
async function loadPublishedCreator(handle: string) {
  const creator = await prisma.users.findFirst({
    where: { handle: handle.toLowerCase().trim() },
    select: { ...PUBLIC_CREATOR_SELECT, user_type: true, storefront: true },
  });
  if (!creator) return null;
  if (!creator.user_type?.includes("CREATOR" as any)) return null;
  if (!creator.storefront?.is_published) return null;
  return creator;
}

export class StorefrontController {
  // ── Handle availability — used by the signup "claim your link" field ────────
  static async checkHandle(req: Request, res: Response) {
    const handle = String(req.query.handle || "").toLowerCase().trim();
    if (!handle) {
      return ApiResponseHandler.customError(res, "Handle is required", 400, "MISSING_HANDLE");
    }

    try {
      const rejection = await validateHandle(handle);
      return ApiResponseHandler.success(
        res,
        {
          handle,
          available: rejection === null,
          reason: rejection,
          message: rejection ? HANDLE_MESSAGES[rejection] : "Available",
          // Only suggest when it is genuinely taken — a malformed handle should
          // be corrected by the user, not silently swapped.
          suggestion: rejection === "TAKEN" ? await generateUniqueHandle(handle) : null,
          url: rejection === null ? `https://${handle}.manchly.com` : null,
        },
        rejection ? "Handle unavailable" : "Handle available",
      );
    } catch (err: any) {
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── The storefront itself ───────────────────────────────────────────────────
  static async getStorefront(req: Request, res: Response) {
    const handle = String(req.params.handle || "").toLowerCase().trim();

    if (validateHandleFormat(handle) === "INVALID_CHARS") {
      return ApiResponseHandler.customError(res, "Invalid handle", 400, "INVALID_HANDLE");
    }

    try {
      const creator = await loadPublishedCreator(handle);
      if (!creator) {
        return ApiResponseHandler.customError(res, "Storefront not found", 404, "STOREFRONT_NOT_FOUND");
      }

      const [courses, webinars, sessionProducts, expert] = await Promise.all([
        prisma.courses.findMany({
          where: { creator_id: creator.id, status: "PUBLISHED" },
          select: {
            id: true, title: true, description: true, price: true,
            thumbnail_url: true, thumbnail: true, category: true, tags: true,
            level: true, language: true, duration: true, published_at: true,
            _count: { select: { enrollments: true, videos: true } },
          },
          orderBy: { published_at: "desc" },
        }),
        prisma.webinars.findMany({
          where: {
            creator_id: creator.id,
            status: "PUBLISHED",
            // Past webinars would only clutter a shop window.
            scheduled_at: { gte: new Date() },
          },
          select: {
            id: true, title: true, description: true, price: true,
            thumbnail_url: true, thumbnail: true, category: true, tags: true,
            scheduled_at: true, duration: true, timezone: true,
            max_participants: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: { scheduled_at: "asc" },
        }),
        prisma.session_products.findMany({
          where: { creator_id: creator.id, is_active: true },
          select: {
            id: true, title: true, description: true,
            duration: true, price: true, mode: true,
          },
          orderBy: { price: "asc" },
        }),
        prisma.session_experts.findUnique({
          where: { user_id: creator.id },
          select: {
            profession: true, bio: true, categories: true, experience: true,
            languages: true, rating: true, review_count: true,
            is_active: true, audio_rate: true, video_rate: true,
          },
        }),
      ]);

      const s = creator.storefront!;

      // Fire-and-forget: a view counter must never delay or fail the page.
      prisma.creator_storefronts
        .update({ where: { user_id: creator.id }, data: { view_count: { increment: 1 } } })
        .catch(() => {});

      return ApiResponseHandler.success(
        res,
        {
          creator: {
            id: creator.id,
            name: creator.name,
            handle: creator.handle,
            profile_image: creator.profile_image,
            tagline: s.tagline,
            bio: s.bio,
            cover_image: s.cover_image,
            accent_color: s.accent_color,
            url: `https://${creator.handle}.manchly.com`,
            socials: {
              website: s.website_url,
              instagram: s.instagram || creator.instagram_link,
              linkedin: s.linkedin || creator.linkedin_link,
              youtube: s.youtube || creator.youtube_link,
              twitter: s.twitter,
              facebook: creator.facebook_link,
            },
            expert: expert?.is_active ? expert : null,
          },
          featured: Array.isArray(s.featured) ? s.featured : [],
          courses,
          webinars,
          sessions: sessionProducts,
          counts: {
            courses: courses.length,
            webinars: webinars.length,
            sessions: sessionProducts.length,
          },
        },
        "Storefront retrieved successfully",
      );
    } catch (err: any) {
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── Bookable slots for a creator's 1:1 sessions ─────────────────────────────
  static async getAvailability(req: Request, res: Response) {
    const handle = String(req.params.handle || "").toLowerCase().trim();
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 60);
    const slotMinutes = Math.min(Math.max(Number(req.query.slot) || 30, 15), 180);

    try {
      const creator = await loadPublishedCreator(handle);
      if (!creator) {
        return ApiResponseHandler.customError(res, "Storefront not found", 404, "STOREFRONT_NOT_FOUND");
      }

      const from = new Date();
      const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

      const [rules, booked] = await Promise.all([
        prisma.expert_availability.findMany({
          where: { expert_id: creator.id, is_active: true },
          select: { day_of_week: true, start_time: true, end_time: true },
        }),
        // A cancelled or missed session frees its slot again; everything else
        // (PENDING, ACTIVE, COMPLETED) still occupies it.
        prisma.sessions.findMany({
          where: {
            receiver_id: creator.id,
            scheduled_at: { gte: from, lte: to },
            status: { notIn: ["CANCELLED", "MISSED"] },
          },
          select: { scheduled_at: true, duration: true },
        }),
      ]);

      const takenAt = new Set(
        booked
          .filter((b) => b.scheduled_at)
          .map((b) => new Date(b.scheduled_at as Date).toISOString()),
      );

      const slots: Array<{ start: string; end: string }> = [];
      for (let d = 0; d < days; d++) {
        const day = new Date(from);
        day.setDate(day.getDate() + d);
        const dow = day.getDay();

        for (const rule of rules.filter((r) => r.day_of_week === dow)) {
          const [sh, sm] = String(rule.start_time).split(":").map(Number);
          const [eh, em] = String(rule.end_time).split(":").map(Number);
          if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) continue;

          const cursor = new Date(day);
          cursor.setHours(sh, sm, 0, 0);
          const end = new Date(day);
          end.setHours(eh, em, 0, 0);

          while (cursor.getTime() + slotMinutes * 60_000 <= end.getTime()) {
            const startIso = cursor.toISOString();
            // Skip slots in the past and ones already booked.
            if (cursor > from && !takenAt.has(startIso)) {
              slots.push({
                start: startIso,
                end: new Date(cursor.getTime() + slotMinutes * 60_000).toISOString(),
              });
            }
            cursor.setMinutes(cursor.getMinutes() + slotMinutes);
          }
        }
      }

      return ApiResponseHandler.success(
        res,
        { handle, slot_minutes: slotMinutes, days, slots },
        "Availability retrieved successfully",
      );
    } catch (err: any) {
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
