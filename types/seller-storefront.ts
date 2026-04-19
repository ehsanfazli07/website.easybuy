export const sellerSocialPlatforms = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
  "twitter",
  "whatsapp",
] as const;

export type SellerSocialPlatform = (typeof sellerSocialPlatforms)[number];

export type SellerSocialLinks = Record<SellerSocialPlatform, string>;

export type SellerProductCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  stock: number;
  createdAt: string;
  ratingAvg: number;
  ratingCount: number;
};

export type SellerStorefrontResponse = {
  seller: {
    id: string;
    displayName: string;
    storeName: string | null;
    name: string | null;
    username: string | null;
    bio: string;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    isVerified: boolean;
    followersCount: number;
    followingCount: number;
    productCount: number;
    ratingAvg: number;
    ratingCount: number;
    joinDate: string;
    social: SellerSocialLinks;
    isFollowing: boolean;
  };
  filters: {
    query: string;
    category: string;
    sort: "newest" | "price-asc" | "price-desc" | "popular";
    minPrice: number;
    maxPrice: number;
    availableCategories: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    totalProducts: number;
  };
  products: SellerProductCard[];
};