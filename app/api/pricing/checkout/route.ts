import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { createPaypalOrder } from "@/lib/paypal";
import { getPricingPlan } from "@/lib/pricing-plans";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const checkoutSchema = z.object({
  planId: z.string().min(1),
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

  const payload = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan request." }, { status: 400 });
  }

  const plan = getPricingPlan(parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "Selected plan is invalid." }, { status: 400 });
  }

  const localOrderId = `pack:${session.user.id}:${plan.id}:${Date.now()}`;
  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;

  try {
    const paypalOrder = await createPaypalOrder({
      totalCents: plan.totalCents,
      localOrderId,
      returnUrl: `${baseUrl}/pricing?paypal=success&plan=${plan.id}`,
      cancelUrl: `${baseUrl}/pricing?paypal=cancel&plan=${plan.id}`,
    });

    await prisma.auditLog.create({
      data: {
        action: "pricing.paypal.create",
        target: plan.id,
        details: `PayPal order created: ${paypalOrder.paypalOrderId}`,
        actorId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      approveUrl: paypalOrder.approveUrl,
      paypalOrderId: paypalOrder.paypalOrderId,
    });
  } catch {
    await prisma.errorLog.create({
      data: {
        message: "Failed to initialize pricing checkout",
        source: "api.pricing.checkout",
        actorId: session.user.id,
      },
    });

    return NextResponse.json(
      { error: "Could not start PayPal checkout. Please try again." },
      { status: 502 }
    );
  }
}
