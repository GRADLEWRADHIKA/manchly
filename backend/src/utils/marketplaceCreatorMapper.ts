import { Prisma, UserType } from "@prisma/client";

export function formatFollowersDisplay(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    return `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1_000) {
    const value = count / 1_000;
    return `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(count);
}

export function extractInstagramHandle(instagramLink?: string | null, handle?: string | null): string | null {
  if (handle?.trim()) {
    return handle.replace(/^@/, "");
  }
  if (!instagramLink) {
    return null;
  }
  const trimmed = instagramLink.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/(?:instagram\.com\/|@)([A-Za-z0-9._]+)/i);
  if (match?.[1]) {
    return match[1];
  }
  return trimmed.replace(/^@/, "");
}

export type MarketplaceCreatorCard = {
  id: string;
  name: string;
  niche: string;
  city: string | null;
  bio: string;
  phone: string | null;
  instagram: string | null;
  sebi_registered: boolean;
  followers: string;
  followers_count: number;
  er: string;
  views: string;
  audience: unknown[];
  packages: unknown[];
};

type CreatorSource = {
  id: string;
  name: string | null;
  phone: string | null;
  instagram_link: string | null;
  marketplaceCreatorProfile: {
    niche: string;
    city: string | null;
    bio: string | null;
    instagram_handle: string | null;
    sebi_registered: boolean;
    followers_count: number;
    engagement_rate: string | null;
    views_display: string | null;
    audience: Prisma.JsonValue;
    packages: Prisma.JsonValue;
  } | null;
  sessionExpert?: {
    bio: string | null;
    categories: string[];
  } | null;
};

export function mapCreatorToCard(source: CreatorSource): MarketplaceCreatorCard {
  const profile = source.marketplaceCreatorProfile;
  const expert = source.sessionExpert;
  const followersCount = profile?.followers_count ?? 0;
  const niche = profile?.niche || expert?.categories?.[0] || "General";
  const bio = profile?.bio || expert?.bio || "";

  return {
    id: source.id,
    name: source.name || "Creator",
    niche,
    city: profile?.city ?? null,
    bio,
    phone: source.phone?.replace(/^\+/, "") ?? null,
    instagram: extractInstagramHandle(source.instagram_link, profile?.instagram_handle),
    sebi_registered: profile?.sebi_registered ?? false,
    followers: formatFollowersDisplay(followersCount),
    followers_count: followersCount,
    er: profile?.engagement_rate || "—",
    views: profile?.views_display || "—",
    audience: Array.isArray(profile?.audience) ? (profile!.audience as unknown[]) : [],
    packages: Array.isArray(profile?.packages) ? (profile!.packages as unknown[]) : []
  };
}

export function buildCreatorListWhere(params: {
  search?: string;
  niche?: string;
  sebiOnly?: boolean;
}): Prisma.usersWhereInput {
  const { search, niche, sebiOnly } = params;
  const where: Prisma.usersWhereInput = {
    user_type: { has: UserType.CREATOR }
  };

  const and: Prisma.usersWhereInput[] = [
    {
      OR: [
        { marketplaceCreatorProfile: null },
        { marketplaceCreatorProfile: { is: { is_listed: true } } }
      ]
    }
  ];

  if (niche) {
    and.push({
      OR: [
        {
          marketplaceCreatorProfile: {
            is: { niche: { equals: niche, mode: "insensitive" } }
          }
        },
        {
          sessionExpert: {
            is: { categories: { has: niche } }
          }
        }
      ]
    });
  }

  if (sebiOnly) {
    and.push({
      marketplaceCreatorProfile: {
        is: { sebi_registered: true }
      }
    });
  }

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        {
          marketplaceCreatorProfile: {
            is: { city: { contains: search, mode: "insensitive" } }
          }
        },
        {
          marketplaceCreatorProfile: {
            is: { bio: { contains: search, mode: "insensitive" } }
          }
        },
        {
          marketplaceCreatorProfile: {
            is: { niche: { contains: search, mode: "insensitive" } }
          }
        },
        {
          sessionExpert: {
            is: { bio: { contains: search, mode: "insensitive" } }
          }
        }
      ]
    });
  }

  where.AND = and;
  return where;
}

export const creatorCardInclude = {
  marketplaceCreatorProfile: true,
  sessionExpert: {
    select: {
      bio: true,
      categories: true
    }
  }
} satisfies Prisma.usersInclude;
