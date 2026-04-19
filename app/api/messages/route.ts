import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  recipientId: z.string().trim().min(3),
  sellerId: z.string().trim().min(3),
  message: z.string().trim().min(2).max(1000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first." }, { status: 401 });
  }

  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  if (parsed.data.recipientId === session.user.id) {
    return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
  }

  const [recipient, seller] = await Promise.all([
    prisma.user.findUnique({
      where: { id: parsed.data.recipientId },
      select: { id: true, name: true, username: true },
    }),
    prisma.user.findUnique({
      where: { id: parsed.data.sellerId },
      select: { id: true },
    }),
  ]);

  if (!recipient || !seller) {
    return NextResponse.json({ error: "Conversation target not found." }, { status: 404 });
  }

  const message = await prisma.sellerMessage.create({
    data: {
      sellerId: seller.id,
      senderId: session.user.id,
      recipientId: recipient.id,
      message: parsed.data.message,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: recipient.id,
      title: "New seller message",
      message: `You received a new message from ${message.sender.username || message.sender.name || "a user"}.`,
    },
  });

  return NextResponse.json({ success: true, message });
}