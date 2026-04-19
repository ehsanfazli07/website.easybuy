import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(500),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const reviews = await prisma.review.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  const ratingCount = reviews.length;
  const ratingAvg = ratingCount
    ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(1))
    : 0;

  return NextResponse.json({ reviews, ratingAvg, ratingCount });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await request.json();
  const parsed = reviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: id,
      },
    },
    create: {
      userId: session.user.id,
      productId: id,
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
    },
  });

  return NextResponse.json({ success: true });
}
