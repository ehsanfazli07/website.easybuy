import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const updateSchema = z.object({
  productId: z.string().min(1),
  isActive: z.boolean(),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
        },
      },
    },
  });

  return NextResponse.json({ products });
}

export async function PATCH(request: Request) {
  const originError = enforceSameOriginMutation(request);
  if (originError) {
    return originError;
  }

  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { isActive: parsed.data.isActive },
  });

  return NextResponse.json({ success: true });
}
