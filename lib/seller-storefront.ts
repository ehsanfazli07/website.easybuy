import { prisma } from "@/lib/prisma";
import { emptySellerSocialLinks, normalizeSellerSocialLinks } from "@/lib/seller-profile";
import type { SellerProductCard, SellerStorefrontResponse } from "@/types/seller-storefront";

const DEFAULT_MAX_PRICE = 100000000;

type SellerStorefrontQuery = {
  sellerId: string;
  viewerId?: string;
  query?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeSort(sort?: string): SellerStorefrontResponse["filters"]["sort"] {
  if (sort === "price-asc" || sort === "price-desc" || sort === "popular") {
    return sort;
  }

  return "newest";
}

function sortProducts(
  products: SellerProductCard[],
  sort: SellerStorefrontResponse["filters"]["sort"],
) {
  const nextProducts = [...products];

  nextProducts.sort((left, right) => {
    if (sort === "price-asc") {
      return left.priceCents - right.priceCents || Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }

    if (sort === "price-desc") {
      return right.priceCents - left.priceCents || Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }

    if (sort === "popular") {
      return right.ratingCount - left.ratingCount || right.ratingAvg - left.ratingAvg || Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });

  return nextProducts;
}

export async function getSellerStorefront(
  input: SellerStorefrontQuery,
): Promise<SellerStorefrontResponse | null> {
  const sellerId = input.sellerId;
  const query = input.query?.trim() || "";
  const category = input.category?.trim() || "All";
  const sort = normalizeSort(input.sort);
  const minPrice = Number.isFinite(input.minPrice) ? Math.max(0, input.minPrice || 0) : 0;
  const maxPrice = Number.isFinite(input.maxPrice)
    ? Math.max(minPrice, input.maxPrice || DEFAULT_MAX_PRICE)
    : DEFAULT_MAX_PRICE;
  const pageSize = clampNumber(input.pageSize || 9, 6, 24);

  const [seller, activeProductMeta, filteredProducts, ratingAggregate, isFollowing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        sellerProfile: {
          select: {
            storeName: true,
            description: true,
            coverImageUrl: true,
            avatarUrl: true,
            isVerified: true,
            instagramUrl: true,
            facebookUrl: true,
            tiktokUrl: true,
            youtubeUrl: true,
            telegramUrl: true,
            twitterUrl: true,
            whatsappUrl: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { sellerId, isActive: true },
      select: {
        id: true,
        category: true,
      },
    }),
    prisma.product.findMany({
      where: {
        sellerId,
        isActive: true,
        priceCents: {
          gte: minPrice,
          lte: maxPrice,
        },
        ...(category !== "All" ? { category } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { description: { contains: query } },
                { category: { contains: query } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priceCents: true,
        imageUrl: true,
        stock: true,
        createdAt: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }),
    prisma.review.aggregate({
      where: {
        product: {
          sellerId,
          isActive: true,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    }),
    input.viewerId
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: input.viewerId,
              followingId: sellerId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!seller) {
    return null;
  }

  const allCategories = Array.from(
    new Set(
      activeProductMeta
        .map((product) => product.category.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const normalizedProducts = sortProducts(
    filteredProducts.map((product) => {
      const ratingCount = product.reviews.length;
      const ratingAvg = ratingCount
        ? Number(
            (
              product.reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
            ).toFixed(1),
          )
        : 0;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
        createdAt: product.createdAt.toISOString(),
        ratingAvg,
        ratingCount,
      };
    }),
    sort,
  );

  const totalProducts = normalizedProducts.length;
  const pageCount = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = clampNumber(input.page || 1, 1, pageCount);
  const offset = (page - 1) * pageSize;
  const profile = seller.sellerProfile;
  const social = profile
    ? normalizeSellerSocialLinks({
        instagram: profile.instagramUrl,
        facebook: profile.facebookUrl,
        tiktok: profile.tiktokUrl,
        youtube: profile.youtubeUrl,
        telegram: profile.telegramUrl,
        twitter: profile.twitterUrl,
        whatsapp: profile.whatsappUrl,
      })
    : emptySellerSocialLinks();

  return {
    seller: {
      id: seller.id,
      displayName: profile?.storeName || seller.username || seller.name || "Seller",
      storeName: profile?.storeName || null,
      name: seller.name,
      username: seller.username,
      bio: profile?.description || seller.bio || "Seller has not added a store description yet.",
      avatarUrl: profile?.avatarUrl || seller.image || null,
      coverImageUrl: profile?.coverImageUrl || null,
      isVerified: Boolean(profile?.isVerified),
      followersCount: seller._count.followers,
      followingCount: seller._count.following,
      productCount: activeProductMeta.length,
      ratingAvg: Number((ratingAggregate._avg.rating || 0).toFixed(1)),
      ratingCount: ratingAggregate._count.rating,
      joinDate: seller.createdAt.toISOString(),
      social,
      isFollowing: Boolean(isFollowing),
    },
    filters: {
      query,
      category,
      sort,
      minPrice,
      maxPrice,
      availableCategories: allCategories,
    },
    pagination: {
      page,
      pageSize,
      pageCount,
      totalProducts,
    },
    products: normalizedProducts.slice(offset, offset + pageSize),
  };
}