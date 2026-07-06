import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { users } from "@prisma/client";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

type AuthUserSource = Pick<
  users,
  | "id"
  | "email"
  | "name"
  | "phone"
  | "profile_image"
  | "user_type"
  | "companyName"
  | "isPremium"
  | "freeViewsCount"
  | "premiumExpiresAt"
  | "dob"
  | "kyc_verified"
  | "fcm_token"
  | "instagram_link"
  | "linkedin_link"
  | "youtube_link"
  | "facebook_link"
>;

export function issueAccessToken(userId: string, email?: string | null): string {
  return jwt.sign(
    {
      userId,
      email: email || undefined,
      type: "access"
    },
    JWT_SECRET,
    { expiresIn: "365d" }
  );
}

export function serializeAuthUser(user: AuthUserSource, overrideUserType?: string) {
  const userType =
    overrideUserType ||
    (Array.isArray(user.user_type) ? user.user_type[0] : user.user_type);

  const profileViewsUsed = user.freeViewsCount ?? 0;
  const isPremium = user.isPremium ?? false;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    user_type: userType,
    company_name: user.companyName ?? null,
    is_premium: isPremium,
    profile_views_used: profileViewsUsed,
    profile_image: user.profile_image ?? null,
    dob: user.dob ?? null,
    kyc_verified: user.kyc_verified ?? false,
    premium_expires_at: user.premiumExpiresAt?.toISOString() ?? null,
    fcm_token: user.fcm_token ?? null,
    instagram_link: user.instagram_link ?? null,
    linkedin_link: user.linkedin_link ?? null,
    youtube_link: user.youtube_link ?? null,
    facebook_link: user.facebook_link ?? null,
    // camelCase fallbacks for frontend
    companyName: user.companyName ?? null,
    isPremium,
    profileViewsUsed,
    marketplace_profile_views: profileViewsUsed
  };
}

export function serializeSubscription(user: AuthUserSource) {
  const isPremium = user.isPremium ?? false;
  return {
    is_premium: isPremium,
    plan: isPremium ? "premium" : null,
    expires_at: user.premiumExpiresAt?.toISOString() ?? null
  };
}
