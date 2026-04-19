import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getPricingPlan } from "@/lib/pricing-plans";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const intentSchema = z.object({
  planId: z.string().min(1),
  personalMessage: z.string().trim().min(1).max(200),
});

export async function POST(request: Request) {
  const originError = enforceSameOriginMutation(request);
  if (originError) {
    return originError;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first." }, { status: 401 });
  }

  const parsed = intentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid pricing intent." }, { status: 400 });
  }

  const plan = getPricingPlan(parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
    take: 5,
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New pricing checkout intent",
        message: `Plan ${plan.duration} (${plan.price}) checkout initiated by ${session.user.email || session.user.id}. Note: ${parsed.data.personalMessage}`,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "pricing.hosted.intent",
      target: plan.id,
      details: `Hosted PayPal checkout intent. Message: ${parsed.data.personalMessage}`,
      actorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}