import { Request, Response } from "express";
import { Prisma, Niche } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HIGH_FOLLOWER_THRESHOLD } from "../utils/marketplaceConstants";

const VALID_NICHES = new Set<string>(["Finance", "AI", "Beauty", "Fitness", "SaaS"]);


function stripSensitive(profile: Record<string, any>) {
  const { phone, instagram, linkEducation, linkCollabs, linkConsulting, linkUgc, ...safe } = profile;
  return {
    ...safe,
    links: {
      education:linkEducation  ?? "",
      collabs:linkCollabs    ?? "",
      consulting: linkConsulting ?? "",
      ugc: linkUgc        ?? "",
    },
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────
export const listCreators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { niche, sebiOnly, q } = req.query as Record<string, string>;

    const where: Prisma.creator_profilesWhereInput = {
      isPublished: true,
    };

    if (niche && VALID_NICHES.has(niche)) {
      where.niche = niche as Niche;
    }

    if (sebiOnly === "true") {
      where.sebiRegistered = true;
    }

    if (q && q.trim() !== "") {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { bio:  { contains: q, mode: "insensitive" } },
      ];
    }

    const creators = await prisma.creator_profiles.findMany({
      where,
      select: {
        id: true,
        name: true,
        niche:true,
        city:true,
        bio: true,
        sebiRegistered: true,
        followers:true,
        engagementRate: true,
        avgViews: true,
      },
    });

    res.json({ success: true, data: creators });
  } catch (err) {
    throw err;
  }
};


export const getCreatorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { profileId } = req.params;

    const profile = await prisma.creator_profiles.findUnique({
      where: { id: profileId, isPublished: true },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: "NOT_FOUND" });
      return;
    }

    res.json({ success: true, data: stripSensitive(profile as any) });
  } catch (err) {
    throw err;
  }
};

export const trackProfileView = async (req: Request, res: Response): Promise<void> => {
  try {
    const brandUserId      = (req as any).user.id as string;
    const creatorProfileId = req.params.profileId;

    let alreadyViewed = false;

    try {
      await prisma.profile_views.create({
        data: { brandUserId, creatorProfileId },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation -> brand already viewed this profile
      if (err?.code === "P2002") {
        alreadyViewed = true;
      } else {
        throw err;
      }
    }

    const totalViews = await prisma.profile_views.count({
      where: { brandUserId },
    });

    res.json({
      success: true,
      data: {
        alreadyViewed,
        totalViews,
        limitReached: totalViews >= 5,
      },
    });
  } catch (err) {
    throw err;
  }
};

export const getCreatorContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const brandUserId = (req as any).user.id as string;
    const profileId = req.params.profileId;

    const [brandUser, profile] = await Promise.all([
      prisma.users.findUnique({
        where: { id: brandUserId },
        select: { isPremium: true }
      }),
      prisma.creator_profiles.findUnique({
        where: { id: profileId, isPublished: true },
        select: { phone: true, instagram: true, followers: true }
      })
    ]);

    if (!profile) {
      res.status(404).json({ success: false, error: "NOT_FOUND" });
      return;
    }

    const followersCount = parseFollowersCount(profile.followers);
    const requiresPremium =
      followersCount > HIGH_FOLLOWER_THRESHOLD && !brandUser?.isPremium;

    if (requiresPremium) {
      res.status(403).json({
        success: false,
        error: "PREMIUM_REQUIRED",
        followers_count: followersCount,
        threshold: HIGH_FOLLOWER_THRESHOLD
      });
      return;
    }

    console.log(
      `[contact-unlock] brandUserId=${brandUserId} profileId=${profileId} timestamp=${new Date().toISOString()}`
    );

    res.json({ success: true, data: { phone: profile.phone, instagram: profile.instagram, locked: false } });
  } catch (err) {
    throw err;
  }
};

function parseFollowersCount(followers: string): number {
  const normalized = followers.trim().toUpperCase().replace(/,/g, "");
  const match = normalized.match(/^([\d.]+)([KM])?$/);
  if (!match) {
    const digits = parseInt(normalized.replace(/\D/g, ""), 10);
    return Number.isFinite(digits) ? digits : 0;
  }
  const base = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === "M") return Math.round(base * 1_000_000);
  if (suffix === "K") return Math.round(base * 1_000);
  return Math.round(base);
}
