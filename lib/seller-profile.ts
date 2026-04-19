import {
  sellerSocialPlatforms,
  type SellerSocialLinks,
  type SellerSocialPlatform,
} from "@/types/seller-storefront";

export function emptySellerSocialLinks(): SellerSocialLinks {
  return {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    telegram: "",
    twitter: "",
    whatsapp: "",
  };
}

export function normalizeSellerSocialLinks(
  input?: Partial<Record<SellerSocialPlatform, string | null | undefined>> | null,
): SellerSocialLinks {
  const base = emptySellerSocialLinks();

  for (const platform of sellerSocialPlatforms) {
    const value = input?.[platform];
    base[platform] = typeof value === "string" ? value.trim() : "";
  }

  return base;
}