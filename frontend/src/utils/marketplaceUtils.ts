export const FREE_PROFILE_VIEW_LIMIT = 5;
export const HIGH_FOLLOWER_THRESHOLD = 10_000;

export const MARKETPLACE_ROLES = ['BRAND', 'AGENCY'] as const;

export type MarketplaceRole = (typeof MARKETPLACE_ROLES)[number];

export const canAccessMarketplace = (user: any): boolean => {
  const role = String(user?.user_type || '').toUpperCase();
  return MARKETPLACE_ROLES.includes(role as MarketplaceRole);
};

export const isPremiumUser = (user: any): boolean =>
  Boolean(user?.is_premium ?? user?.isPremium);

export const getProfileViewsUsed = (user: any): number => {
  const raw =
    user?.profile_views_used ??
    user?.profileViewsUsed ??
    user?.marketplace_profile_views ??
    0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const hasReachedProfileViewLimit = (user: any): boolean =>
  !isPremiumUser(user) &&
  getProfileViewsUsed(user) >= FREE_PROFILE_VIEW_LIMIT;

/**
 * Parses follower count strings such as "486K", "1.2M", or "9500".
 */
export const parseFollowerCount = (followers: string | number): number => {
  if (typeof followers === 'number') {
    return Number.isFinite(followers) ? followers : 0;
  }

  const normalized = String(followers || '')
    .trim()
    .replace(/,/g, '')
    .toUpperCase();

  if (!normalized) {
    return 0;
  }

  const match = normalized.match(/^([\d.]+)\s*([KMB])?$/);
  if (!match) {
    const digitsOnly = Number(normalized.replace(/[^\d.]/g, ''));
    return Number.isFinite(digitsOnly) ? digitsOnly : 0;
  }

  const base = Number(match[1]);
  if (!Number.isFinite(base)) {
    return 0;
  }

  const suffix = match[2];
  if (suffix === 'K') return Math.round(base * 1_000);
  if (suffix === 'M') return Math.round(base * 1_000_000);
  if (suffix === 'B') return Math.round(base * 1_000_000_000);

  return Math.round(base);
};

export const isHighFollowerCreator = (
  followers: string | number,
): boolean => parseFollowerCount(followers) > HIGH_FOLLOWER_THRESHOLD;

export const shouldLockContactActions = (
  creatorFollowers: string | number,
  user: any,
): boolean => isHighFollowerCreator(creatorFollowers) && !isPremiumUser(user);
