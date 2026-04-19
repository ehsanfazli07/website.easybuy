import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSellerStorefront } from "@/lib/seller-storefront";
import { sellerSocialPlatforms } from "@/types/seller-storefront";

const profileSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(10).max(600),
  coverImageUrl: z.string().trim().url().max(2048).or(z.literal("")),
  avatarUrl: z.string().trim().url().max(2048).or(z.literal("")),
  social: z.object({
    instagram: z.string().trim().url().max(2048).or(z.literal("")),
    facebook: z.string().trim().url().max(2048).or(z.literal("")),
    tiktok: z.string().trim().url().max(2048).or(z.literal("")),
    youtube: z.string().trim().url().max(2048).or(z.literal("")),
    telegram: z.string().trim().url().max(2048).or(z.literal("")),
    twitter: z.string().trim().url().max(2048).or(z.literal("")),
    whatsapp: z.string().trim().url().max(2048).or(z.literal("")),
  }),
});

function getSellerIdFromParam(id: string, sessionUserId?: string) {
  if (id === "me") {
    return sessionUserId || null;
  }

  return id;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const sellerId = getSellerIdFromParam(id, session?.user?.id);

  if (!sellerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storefront = await getSellerStorefront({
    sellerId,
    viewerId: session?.user?.id,
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "All",
    sort: searchParams.get("sort") || "newest",
    minPrice: Number(searchParams.get("min") || 0),
    maxPrice: Number(searchParams.get("max") || 100000000),
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 9),
  });

  if (!storefront) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  return NextResponse.json(storefront);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const sellerId = getSellerIdFromParam(id, session.user.id);

  if (!sellerId || sellerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid seller profile data." }, { status: 400 });
  }

  const socialData = Object.fromEntries(
    sellerSocialPlatforms.map((platform) => [platform, parsed.data.social[platform].trim()]),
  );

  await prisma.user.update({
    where: { id: sellerId },
    data: {
      role: "SELLER",
      bio: parsed.data.bio,
      sellerProfile: {
        upsert: {
          create: {
            storeName: parsed.data.storeName,
            description: parsed.data.bio,
            coverImageUrl: parsed.data.coverImageUrl || null,
            avatarUrl: parsed.data.avatarUrl || null,
            instagramUrl: socialData.instagram || null,
            facebookUrl: socialData.facebook || null,
            tiktokUrl: socialData.tiktok || null,
            youtubeUrl: socialData.youtube || null,
            telegramUrl: socialData.telegram || null,
            twitterUrl: socialData.twitter || null,
            whatsappUrl: socialData.whatsapp || null,
          },
          update: {
            storeName: parsed.data.storeName,
            description: parsed.data.bio,
            coverImageUrl: parsed.data.coverImageUrl || null,
            avatarUrl: parsed.data.avatarUrl || null,
            instagramUrl: socialData.instagram || null,
            facebookUrl: socialData.facebook || null,
            tiktokUrl: socialData.tiktok || null,
            youtubeUrl: socialData.youtube || null,
            telegramUrl: socialData.telegram || null,
            twitterUrl: socialData.twitter || null,
            whatsappUrl: socialData.whatsapp || null,
          },
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "seller.profile.update",
      target: sellerId,
      details: "Seller storefront profile updated.",
      actorId: session.user.id,
    },
  });

  const storefront = await getSellerStorefront({
    sellerId,
    viewerId: session.user.id,
  });

  return NextResponse.json(storefront);
}