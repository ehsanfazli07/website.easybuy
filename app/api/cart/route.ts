import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          seller: {
            select: { id: true, name: true, username: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCents = items.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);

  return NextResponse.json({ items, totalCents });
}
