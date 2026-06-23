import { NextFunction, Response } from "express";
import prisma from "../prismaClient";
import { JWTRequest } from "./jwtAuth";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { canAccessCreatorMarketplace } from "../utils/userTypeHelper";

export interface CreatorMarketplaceRequest extends JWTRequest {
  marketplaceUser?: {
    id: string;
    user_type: any;
    is_premium: boolean;
    profile_views_used: number;
    // camelCase fallbacks
    isPremium: boolean;
    freeViewsCount: number;
  };
}

export async function requireCreatorMarketplaceAccess(
  req: CreatorMarketplaceRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.userId) {
    return ApiResponseHandler.customError(res, "Authentication required", 401, "UNAUTHENTICATED");
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        user_type: true,
        isPremium: true,
        freeViewsCount: true
      }
    });

    if (!user) {
      return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
    }

    if (!canAccessCreatorMarketplace(user.user_type)) {
      return ApiResponseHandler.customError(
        res,
        "Marketplace is available only for Brand and Agency accounts.",
        403,
        "MARKETPLACE_ACCESS_DENIED"
      );
    }

    req.marketplaceUser = {
      id: user.id,
      user_type: user.user_type,
      is_premium: user.isPremium,
      profile_views_used: user.freeViewsCount,
      isPremium: user.isPremium,
      freeViewsCount: user.freeViewsCount
    };
    next();
  } catch (err: any) {
    ApiResponseHandler.unexpectedError(res, err, 500);
  }
}
