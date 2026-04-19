import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(8).max(1000),
  category: z.string().min(2).max(50).optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(1).max(10000),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

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

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product fields." }, { status: 400 });
  }

  const slug = `${parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      title: parsed.data.title.trim(),
      slug,
      description: parsed.data.description.trim(),
      category: parsed.data.category?.trim() || "General",
      priceCents: parsed.data.priceCents,
      stock: parsed.data.stock,
      imageUrl: parsed.data.imageUrl || null,
      sellerId: session.user.id,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "SELLER" },
  });

  await prisma.auditLog.create({
    data: {
      action: "product.create",
      target: product.id,
      details: "User listed a new product for sale.",
      actorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, product });
}
