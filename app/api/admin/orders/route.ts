import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const updateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["Pending", "Shipped", "Completed"]),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
        },
      },
      paymentRecord: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              seller: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ orders });
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

  const { orderId, status } = parsed.data;
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: { userId: true, id: true },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: "Order status updated",
      message: `Your order is now ${status}.`,
    },
  });

  return NextResponse.json({ success: true });
}
