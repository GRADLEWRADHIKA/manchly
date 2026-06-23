import { Response } from "express";
import { UserType } from "@prisma/client";
import prisma from "../prismaClient";
import { CreatorMarketplaceRequest } from "../middleware/creatorMarketplaceAccess";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { canAccessCreatorMarketplace } from "../utils/userTypeHelper";
import {
  FREE_PROFILE_VIEW_LIMIT,
  HIGH_FOLLOWER_THRESHOLD
} from "../utils/marketplaceConstants";
import {
  buildCreatorListWhere,
  creatorCardInclude,
  mapCreatorToCard
} from "../utils/marketplaceCreatorMapper";

async function fetchCreatorCard(creatorId: string) {
  const creator = await prisma.users.findFirst({
    where: {
      id: creatorId,
      user_type: { has: UserType.CREATOR }
    },
    select: {
      id: true,
      name: true,
      phone: true,
      instagram_link: true,
      marketplaceCreatorProfile: true,
      sessionExpert: {
        select: {
          bio: true,
          categories: true
        }
      }
    }
  });

  if (!creator) {
    return null;
  }

  return mapCreatorToCard(creator);
}

export class MarketplaceController {
  /**
   * GET /marketplace/creators
   */
  static async listCreators(req: CreatorMarketplaceRequest, res: Response) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const niche = typeof req.query.niche === "string" ? req.query.niche.trim() : undefined;
      const sebiOnly =
        req.query.sebi_only === "true" ||
        req.query.sebi_only === "1" ||
        req.query.sebiOnly === "true";

      const where = buildCreatorListWhere({ search, niche, sebiOnly });

      const creators = await prisma.users.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          instagram_link: true,
          marketplaceCreatorProfile: true,
          sessionExpert: {
            select: {
              bio: true,
              categories: true
            }
          }
        },
        orderBy: { created_at: "desc" }
      });

      const cards = creators.map(mapCreatorToCard);
      const viewer = req.marketplaceUser;

      ApiResponseHandler.success(
        res,
        {
          creators: cards,
          profile_views_used: viewer?.profile_views_used ?? 0,
          is_premium: viewer?.is_premium ?? false,
          free_views_remaining: viewer?.is_premium
            ? null
            : Math.max(FREE_PROFILE_VIEW_LIMIT - (viewer?.profile_views_used ?? 0), 0)
        },
        "Creators retrieved successfully"
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * POST /marketplace/creators/:creatorId/view
   */
  static async viewCreatorProfile(req: CreatorMarketplaceRequest, res: Response) {
    const { creatorId } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return ApiResponseHandler.customError(res, "Authentication required", 401, "UNAUTHENTICATED");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const requester = await tx.users.findUnique({
          where: { id: requesterId },
          select: {
            id: true,
            user_type: true,
            isPremium: true,
            freeViewsCount: true
          }
        });

        if (!requester) {
          return { status: "REQUESTER_NOT_FOUND" as const };
        }

        if (!canAccessCreatorMarketplace(requester.user_type)) {
          return { status: "FORBIDDEN" as const };
        }

        const creator = await tx.users.findFirst({
          where: {
            id: creatorId,
            user_type: { has: UserType.CREATOR }
          },
          select: {
            id: true,
            name: true,
            phone: true,
            instagram_link: true,
            marketplaceCreatorProfile: true,
            sessionExpert: {
              select: {
                bio: true,
                categories: true
              }
            }
          }
        });

        if (!creator) {
          return { status: "CREATOR_NOT_FOUND" as const };
        }

        const existingView = await tx.marketplace_profile_views.findUnique({
          where: {
            user_id_creator_id: {
              user_id: requesterId,
              creator_id: creatorId
            }
          }
        });

        const creatorCard = mapCreatorToCard(creator);

        if (existingView) {
          return {
            status: "ALLOWED" as const,
            creator: creatorCard,
            profile_views_used: requester.freeViewsCount,
            is_premium: requester.isPremium,
            locked: false
          };
        }

        if (!requester.isPremium) {
          if (requester.freeViewsCount >= FREE_PROFILE_VIEW_LIMIT) {
            return {
              status: "LIMIT_REACHED" as const,
              profile_views_used: requester.freeViewsCount
            };
          }

          const incrementResult = await tx.users.updateMany({
            where: {
              id: requesterId,
              isPremium: false,
              freeViewsCount: { lt: FREE_PROFILE_VIEW_LIMIT }
            },
            data: {
              freeViewsCount: { increment: 1 }
            }
          });

          if (incrementResult.count === 0) {
            return {
              status: "LIMIT_REACHED" as const,
              profile_views_used: requester.freeViewsCount
            };
          }
        }

        await tx.marketplace_profile_views.create({
          data: {
            user_id: requesterId,
            creator_id: creatorId
          }
        });

        const updatedRequester = await tx.users.findUnique({
          where: { id: requesterId },
          select: {
            freeViewsCount: true,
            isPremium: true
          }
        });

        return {
          status: "ALLOWED" as const,
          creator: creatorCard,
          profile_views_used: updatedRequester?.freeViewsCount ?? requester.freeViewsCount,
          is_premium: updatedRequester?.isPremium ?? requester.isPremium,
          locked: false
        };
      });

      if (result.status === "REQUESTER_NOT_FOUND") {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      if (result.status === "FORBIDDEN") {
        return ApiResponseHandler.customError(
          res,
          "Marketplace is available only for Brand and Agency accounts.",
          403,
          "MARKETPLACE_ACCESS_DENIED"
        );
      }

      if (result.status === "CREATOR_NOT_FOUND") {
        return ApiResponseHandler.customError(res, "Creator not found", 404, "CREATOR_NOT_FOUND");
      }

      if (result.status === "LIMIT_REACHED") {
        return ApiResponseHandler.customError(
          res,
          "You have used your 5 free creator profile views.",
          403,
          "PROFILE_VIEW_LIMIT_REACHED",
          {
            locked: true,
            reason: "PROFILE_VIEW_LIMIT_REACHED",
            profile_views_used: result.profile_views_used,
            limit: FREE_PROFILE_VIEW_LIMIT
          }
        );
      }

      ApiResponseHandler.success(
        res,
        {
          creator: result.creator,
          profile_views_used: result.profile_views_used,
          is_premium: result.is_premium,
          locked: false
        },
        "Creator profile retrieved successfully"
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * GET /marketplace/creators/:creatorId/contact
   */
  static async getCreatorContact(req: CreatorMarketplaceRequest, res: Response) {
    const { creatorId } = req.params;

    try {
      const creator = await fetchCreatorCard(creatorId);
      if (!creator) {
        return ApiResponseHandler.customError(res, "Creator not found", 404, "CREATOR_NOT_FOUND");
      }

      const viewer = req.marketplaceUser!;
      const requiresPremium =
        creator.followers_count > HIGH_FOLLOWER_THRESHOLD && !viewer.is_premium;

      if (requiresPremium) {
        return ApiResponseHandler.customError(
          res,
          "Premium subscription required to contact creators with more than 10,000 followers.",
          403,
          "PREMIUM_REQUIRED",
          {
            locked: true,
            followers_count: creator.followers_count,
            threshold: HIGH_FOLLOWER_THRESHOLD
          }
        );
      }

      ApiResponseHandler.success(
        res,
        {
          phone: creator.phone,
          instagram: creator.instagram,
          locked: false
        },
        "Creator contact retrieved successfully"
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
