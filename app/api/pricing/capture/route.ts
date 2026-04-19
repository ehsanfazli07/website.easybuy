import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { capturePaypalOrder } from "@/lib/paypal";
import { getPricingPlan } from "@/lib/pricing-plans";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const captureSchema = z.object({
  paypalOrderId: z.string().min(1),
});

export async function POST(request: Request) {
  const originError = enforceSameOriginMutation(request);
  if (originError) {
    return originError;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = captureSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let captureResult;
  try {
    captureResult = await capturePaypalOrder(parsed.data.paypalOrderId);
  } catch {
    await prisma.errorLog.create({
      data: {
        message: "Pricing PayPal capture failed",
        source: "api.pricing.capture",
        actorId: session.user.id,
      },
    });

    return NextResponse.json({ error: "PayPal capture failed" }, { status: 502 });
  }

  if (captureResult.status !== "COMPLETED") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const customId = captureResult.purchase_units?.[0]?.custom_id || "";
  const expectedPrefix = `pack:${session.user.id}:`;
  if (!customId.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Order validation failed" }, { status: 400 });
  }

  const parts = customId.split(":");
  const planId = parts[2] || "";
  const plan = getPricingPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Plan verification failed" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { hasActivePack: true },
    });

    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: "Plan activated",
        message: `Payment completed for ${plan.duration} plan via PayPal/Card checkout.`,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "pricing.paypal.capture",
        target: plan.id,
        details: `PayPal order captured: ${parsed.data.paypalOrderId}`,
        actorId: session.user.id,
      },
    });
  });

  return NextResponse.json({ success: true });
}
