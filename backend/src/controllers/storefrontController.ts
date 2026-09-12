import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import {
  validateHandle,
  validateHandleFormat,
  HANDLE_MESSAGES,
  generateUniqueHandle,
} from "../utils/handle";
import { isCreator } from "../utils/userTypeHelper";

/** Fields safe to expose on a public page. Only selecting fields existing on `users` model. */
const PUBLIC_CREATOR_SELECT = {
  id: true,
  name: true,
  handle: true,
  profile_image: true,
  kyc_verified: true,
} as const;

/** Load a creator for storefront (by handle or id). */
async function loadPublishedCreator(handleOrId: string) {
  const term = String(handleOrId || "").trim();
  if (!term) return null;

  const creator = await prisma.users.findFirst({
    where: {
      OR: [
        { handle: { equals: term, mode: "insensitive" } },
        { id: term },
      ],
    },
    select: { ...PUBLIC_CREATOR_SELECT, user_type: true, storefront: true },
  });
  if (!creator) return null;
  if (!isCreator(creator.user_type)) return null;
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
    const handle = String(req.params.handle || "").trim();

    try {
      const creator = await loadPublishedCreator(handle);
      if (!creator) {
        return ApiResponseHandler.customError(res, "Storefront not found", 404, "STOREFRONT_NOT_FOUND");
      }

      const [courses, webinars, sessionProducts, expert, courseLearners, webinarLearners] = await Promise.all([
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
        prisma.enrollments.findMany({
          where: { course: { creator_id: creator.id, status: "PUBLISHED" } },
          select: { user_id: true },
          distinct: ["user_id"],
        }),
        prisma.webinar_enrollments.findMany({
          where: { webinar: { creator_id: creator.id, status: "PUBLISHED", scheduled_at: { gte: new Date() } } },
          select: { user_id: true },
          distinct: ["user_id"],
        }),
      ]);

      const s = creator.storefront || ({} as any);
      const learnerIds = new Set([
        ...courseLearners.map((e) => e.user_id),
        ...webinarLearners.map((e) => e.user_id),
      ]);

      // Fire-and-forget: a view counter must never delay or fail the page.
      if (creator.storefront) {
        prisma.creator_storefronts
          .update({ where: { user_id: creator.id }, data: { view_count: { increment: 1 } } })
          .catch(() => {});
      }

      return ApiResponseHandler.success(
        res,
        {
          creator: {
            id: creator.id,
            name: creator.name,
            handle: creator.handle || creator.id,
            profile_image: creator.profile_image,
            kyc_verified: creator.kyc_verified,
            city: null,
            state: null,
            country: null,
            location: null,
            tagline: s.tagline || "",
            bio: s.bio || "",
            cover_image: s.cover_image || null,
            accent_color: s.accent_color || "#2563EB",
            expertise: Array.isArray((s as any).expertise) ? (s as any).expertise : [],
            experience_years: (s as any).experience_years || null,
            url: creator.handle ? `https://${creator.handle}.manchly.com` : null,
            socials: {
              website: s.website_url || null,
              instagram: s.instagram || null,
              linkedin: s.linkedin || null,
              youtube: s.youtube || null,
              twitter: s.twitter || null,
              facebook: null,
            },
            expert: expert?.is_active ? expert : null,
          },
          featured: Array.isArray(s.featured) ? s.featured : [],
          courses,
          webinars,
          sessions: sessionProducts,
          counts: {
            learners: learnerIds.size,
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

  static async getMyStorefront(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators have a storefront", 403, "FORBIDDEN");
      }

      // Lazily create an empty row so the edit page always has something to bind to.
      const storefront = await prisma.creator_storefronts.upsert({
        where: { user_id: userId },
        update: {},
        create: { user_id: userId },
      });

      return ApiResponseHandler.success(
        res,
        {
          storefront,
          handle: user.handle,
          name: user.name,
          profile_image: user.profile_image,
        },
        "Storefront retrieved successfully",
      );
    } catch (err: any) {
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /** PUT /creator/storefront/me — update the creator's own storefront. */
  static async updateMyStorefront(req: any, res: Response) {
    const userId = req.user.userId;
    const {
      tagline,
      bio,
      cover_image,
      accent_color,
      expertise,
      experience_years,
      website_url,
      instagram,
      linkedin,
      youtube,
      twitter,
      is_published,
    } = req.body;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators have a storefront", 403, "FORBIDDEN");
      }

      const updateData: any = {};
      if (tagline !== undefined) updateData.tagline = String(tagline).trim();
      if (bio !== undefined) updateData.bio = String(bio).trim();
      if (cover_image !== undefined) updateData.cover_image = cover_image || null;
      if (accent_color !== undefined) updateData.accent_color = accent_color;

      if (expertise !== undefined) {
        updateData.expertise = Array.isArray(expertise) ? expertise.map(String) : [];
      }

      // Safely convert string experience ranges (e.g., "1-3 Years") to Int for Prisma
      if (experience_years !== undefined) {
        if (typeof experience_years === "number") {
          updateData.experience_years = experience_years;
        } else if (typeof experience_years === "string" && experience_years.trim() !== "") {
          const numbers = experience_years.match(/\d+/g);
          updateData.experience_years = numbers ? parseInt(numbers[numbers.length - 1], 10) : null;
        } else {
          updateData.experience_years = null;
        }
      }

      if (website_url !== undefined) updateData.website_url = website_url || null;
      if (instagram !== undefined) updateData.instagram = instagram || null;
      if (linkedin !== undefined) updateData.linkedin = linkedin || null;
      if (youtube !== undefined) updateData.youtube = youtube || null;
      if (twitter !== undefined) updateData.twitter = twitter || null;
      if (is_published !== undefined) updateData.is_published = Boolean(is_published);

      const storefront = await prisma.creator_storefronts.upsert({
        where: { user_id: userId },
        update: updateData,
        create: { user_id: userId, ...updateData },
      });

      return ApiResponseHandler.success(res, { storefront }, "Storefront updated successfully");
    } catch (err: any) {
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}