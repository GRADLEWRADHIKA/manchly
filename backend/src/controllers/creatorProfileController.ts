import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Niche } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts flat link columns to the nested { education, collabs, consulting, ugc } shape. */
function toNestedLinks(profile: Record<string, any>) {
  const { linkEducation, linkCollabs, linkConsulting, linkUgc, ...rest } = profile;
  return {
    ...rest,
    links: {
      education:  linkEducation  ?? "",
      collabs:    linkCollabs    ?? "",
      consulting: linkConsulting ?? "",
      ugc:        linkUgc        ?? "",
    },
  };
}

/** Maps a body.links object to the flat Prisma column names. */
function flattenLinks(links: Record<string, string> = {}) {
  return {
    linkEducation:  links.education  ?? "",
    linkCollabs:    links.collabs    ?? "",
    linkConsulting: links.consulting ?? "",
    linkUgc:        links.ugc        ?? "",
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/creator/profile
 * Returns the authenticated creator's profile (or null if not yet created).
 */
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;

    const profile = await prisma.creator_profiles.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({ success: true, data: toNestedLinks(profile as any) });
  } catch (err) {
    throw err;
  }
};

/**
 * POST /api/creator/profile
 * Creates a new creator profile for the authenticated user.
 */
export const createProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;

    const existing = await prisma.creator_profiles.findUnique({
      where: { userId },
    });

    if (existing) {
      res.status(409).json({ success: false, error: "PROFILE_ALREADY_EXISTS" });
      return;
    }

    const {
      name,
      bio,
      niche,
      city,
      phone,
      instagram,
      sebiRegistered,
      followers,
      engagementRate,
      avgViews,
      links = {},
      audience = [],
      packages = [],
      metaPermissions,
    } = req.body;

    const created = await prisma.creator_profiles.create({
      data: {
        userId,
        name,
        bio: bio  ?? "",
        niche:  niche as Niche,
        city,
        phone,
        instagram,
        sebiRegistered: sebiRegistered ?? false,
        followers,
        engagementRate,
        avgViews,
        ...flattenLinks(links),
        audience,
        packages,
        ...(metaPermissions ? { metaPermissions } : {}),
      },
    });

    res.status(201).json({ success: true, data: toNestedLinks(created as any) });
  } catch (err) {
    throw err;
  }
};
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;

    const {
      isPublished: _stripped, // intentionally ignored
      links = {},
      name,
      bio,
      niche,
      city,
      phone,
      instagram,
      sebiRegistered,
      followers,
      engagementRate,
      avgViews,
      audience,
      packages,
      metaPermissions,
    } = req.body;

    const flatLinks = flattenLinks(links);

    const safeDefaults = {
      bio: bio ?? "",
      sebiRegistered: sebiRegistered ?? false,
      audience: audience ?? [],
      packages: packages  ?? [],
    };

    const updateData: Record<string, any> = {
      ...(name !== undefined && { name }),
      ...(bio  !== undefined && { bio }),
      ...(niche  !== undefined && { niche: niche as Niche }),
      ...(city  !== undefined && { city }),
      ...(phone !== undefined && { phone }),
      ...(instagram   !== undefined && { instagram }),
      ...(sebiRegistered  !== undefined && { sebiRegistered }),
      ...(followers !== undefined && { followers }),
      ...(engagementRate  !== undefined && { engagementRate }),
      ...(avgViews !== undefined && { avgViews }),
      ...(audience !== undefined && { audience }),
      ...(packages !== undefined && { packages }),
      ...(metaPermissions !== undefined && { metaPermissions }),
      ...flatLinks,
    };

    const upserted = await prisma.creator_profiles.upsert({
      where:  { userId },
      update: updateData,
      create: {
        userId,
        name: name  ?? "",
        niche:(niche   ?? "Finance") as Niche,
        city: city  ?? "",
        phone: phone ?? "",
        instagram: instagram  ?? "",
        followers: followers  ?? "",
        engagementRate: engagementRate ?? "",
        avgViews:  avgViews  ?? "",
        ...safeDefaults,
        ...flatLinks,
        ...(metaPermissions ? { metaPermissions } : {}),
      },
    });

    res.json({ success: true, data: toNestedLinks(upserted as any) });
  } catch (err) {
    throw err;
  }
};

export const togglePublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;

    const profile = await prisma.creator_profiles.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: "NOT_FOUND" });
      return;
    }

    // If currently unpublished (i.e. trying to publish), check required fields
    if (!profile.isPublished) {
      const requiredFields: Array<keyof typeof profile> = [
        "name",
        "niche",
        "city",
        "phone",
        "instagram",
        "followers",
        "engagementRate",
        "avgViews",
      ];

      const missingFields = requiredFields.filter((field) => {
        const val = profile[field];
        return typeof val !== "string" || (val as string).trim() === "";
      });

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: "INCOMPLETE_PROFILE",
          missingFields,
        });
        return;
      }
    }

    const updated = await prisma.creator_profiles.update({
      where: { userId },
      data:  { isPublished: !profile.isPublished },
    });

    res.json({ success: true, data: { isPublished: updated.isPublished } });
  } catch (err) {
    throw err;
  }
};

export const webhookTest = (req: Request, res: Response): void => {
  const comment: string = req.body?.comment ?? "";

  // Derive keyword: first word longer than 3 characters, lowercase
  const keyword =
    comment
      .split(/\s+/)
      .find((w: string) => w.length > 3)
      ?.toLowerCase() ?? "general_inquiry";

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const lines = [
    `$ rigi-meta hook --comment '${comment}'`,
    `[${timestamp}] received instagram.comment.created`,
    `[auth] permissions ok: instagram_manage_insights, messages`,
    `[match] keyword intent: ${keyword}`,
    `[dm] mock fulfillment delivered with tracked link`,
    `[status] 200 OK automation complete`,
  ];

  res.json({ success: true, data: { lines } });
};
