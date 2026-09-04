import { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";
import { handleFromHost } from "../utils/handle";
import { renderStorefront, renderStorefrontNotFound } from "../utils/storefrontPage";

/**
 * Serves a creator's storefront when the request arrives on their subdomain.
 *
 * Mounted before the API routers, but it only ever claims GET requests for the
 * page itself — every API path falls through, so the same origin can still be
 * used for XHR from the storefront if we ever need it.
 */

/** Paths the storefront host must not swallow. */
const RESERVED_PREFIXES = [
  "/auth", "/admin", "/courses", "/webinars", "/sessions", "/payments",
  "/reels", "/public", "/api", "/upload", "/mux", "/settlements", "/kyc",
  "/notifications", "/ai", "/sdk", "/telegram", "/marketplace", "/creators",
  "/subscriptions", "/groups", "/clickancy", "/assets", "/css", "/js", "/favicon",
];

export async function storefrontHost(req: Request, res: Response, next: NextFunction) {
  // Only GET/HEAD can be a page view; anything else is an API call.
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const handle = handleFromHost(req.headers.host);
  // Not a storefront subdomain (apex, www, reserved, or an unrelated host).
  if (!handle) return next();

  const path = req.path.toLowerCase();
  if (path !== "/" && RESERVED_PREFIXES.some((p) => path.startsWith(p))) return next();

  try {
    const creator = await prisma.users.findFirst({
      where: { handle },
      select: {
        id: true, name: true, handle: true, profile_image: true,
        instagram_link: true, linkedin_link: true, youtube_link: true,
        user_type: true, storefront: true,
      },
    });

    const published =
      creator &&
      creator.user_type?.includes("CREATOR" as any) &&
      creator.storefront?.is_published;

    if (!published) {
      return res.status(404).type("html").send(renderStorefrontNotFound(handle));
    }

    const [courses, webinars, sessions] = await Promise.all([
      prisma.courses.findMany({
        where: { creator_id: creator!.id, status: "PUBLISHED" },
        select: {
          id: true, title: true, description: true, price: true, category: true,
          thumbnail_url: true, thumbnail: true,
          _count: { select: { enrollments: true, videos: true } },
        },
        orderBy: { published_at: "desc" },
      }),
      prisma.webinars.findMany({
        where: { creator_id: creator!.id, status: "PUBLISHED", scheduled_at: { gte: new Date() } },
        select: {
          id: true, title: true, description: true, price: true, duration: true,
          scheduled_at: true, thumbnail_url: true, thumbnail: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { scheduled_at: "asc" },
      }),
      prisma.session_products.findMany({
        where: { creator_id: creator!.id, is_active: true },
        select: { id: true, title: true, description: true, duration: true, price: true, mode: true },
        orderBy: { price: "asc" },
      }),
    ]);

    const s = creator!.storefront!;
    const html = renderStorefront({
      creator: {
        id: creator!.id,
        name: creator!.name,
        handle: creator!.handle,
        profile_image: creator!.profile_image,
        tagline: s.tagline,
        bio: s.bio,
        cover_image: s.cover_image,
        accent_color: s.accent_color,
        socials: {
          website: s.website_url,
          instagram: s.instagram || creator!.instagram_link,
          youtube: s.youtube || creator!.youtube_link,
          linkedin: s.linkedin || creator!.linkedin_link,
          twitter: s.twitter,
        },
      },
      courses, webinars, sessions,
    });

    // Fire-and-forget: a view counter must never delay or break the page.
    prisma.creator_storefronts
      .update({ where: { user_id: creator!.id }, data: { view_count: { increment: 1 } } })
      .catch(() => {});

    // Short cache so a burst of shares doesn't hammer the database, but an
    // edit still shows up quickly.
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.status(200).type("html").send(html);
  } catch (err) {
    console.error("storefront render error:", err);
    return res.status(500).type("html").send(renderStorefrontNotFound(handle));
  }
}
