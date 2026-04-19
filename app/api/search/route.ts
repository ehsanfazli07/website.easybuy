import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const minPrice = Number(searchParams.get("min") || 0);
  const maxPrice = Number(searchParams.get("max") || Number.MAX_SAFE_INTEGER);
  const sort = searchParams.get("sort") || "newest";

  const orderBy =
    sort === "price-asc"
      ? { priceCents: "asc" as const }
      : sort === "price-desc"
        ? { priceCents: "desc" as const }
        : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      priceCents: {
        gte: Number.isFinite(minPrice) ? minPrice : 0,
        lte: Number.isFinite(maxPrice) ? maxPrice : Number.MAX_SAFE_INTEGER,
      },
      ...(category && category !== "All" ? { category } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { category: { contains: query } },
              { seller: { username: { contains: query } } },
              { seller: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    orderBy,
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  const posts = await prisma.post.findMany({
    where: {
      isPublished: true,
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { excerpt: { contains: query } },
              { body: { contains: query } },
              { author: { username: { contains: query } } },
              { author: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query ? 16 : 6,
    select: {
      id: true,
      title: true,
      excerpt: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  return NextResponse.json({ products, posts });
}
