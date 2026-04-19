import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PaymentProvider } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { describeSellerCoverage, finalizeCartOrderPayment } from "@/lib/checkout";
import { capturePaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";
import { getStripeCheckoutSession } from "@/lib/stripe";

const captureSchema = z
  .object({
    localOrderId: z.string().min(1),
    paymentMethod: z.enum(["paypal", "card"]),
    paypalOrderId: z.string().min(1).optional(),
    stripeSessionId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod === "paypal" && !value.paypalOrderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "paypalOrderId is required",
        path: ["paypalOrderId"],
      });
    }

    if (value.paymentMethod === "card" && !value.stripeSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "stripeSessionId is required",
        path: ["stripeSessionId"],
      });
    }
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

  const { localOrderId, paypalOrderId } = parsed.data;

  const order = await prisma.order.findFirst({
    where: {
      id: localOrderId,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              title: true,
            },
          },
        },
      },
      paymentRecord: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "Completed") {
    return NextResponse.json({ success: true, alreadyCaptured: true });
  }

  if (parsed.data.paymentMethod === "paypal") {
    let captureResult;

    try {
      captureResult = await capturePaypalOrder(parsed.data.paypalOrderId!);
    } catch {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: localOrderId },
          data: { paymentState: "Failed" },
        });
        await tx.paymentRecord.updateMany({
          where: { orderId: localOrderId },
          data: { status: "Failed" },
        });
        await tx.errorLog.create({
          data: {
            message: "PayPal capture failed",
            source: "api.checkout.capture",
            actorId: session.user.id,
          },
        });
      });

      return NextResponse.json({ error: "PayPal capture failed" }, { status: 502 });
    }

    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const customId = captureResult.purchase_units?.[0]?.custom_id;
    if (customId && customId !== localOrderId) {
      return NextResponse.json({ error: "Order validation failed" }, { status: 400 });
    }

    const payerName = [captureResult.payer?.name?.given_name, captureResult.payer?.name?.surname]
      .filter(Boolean)
      .join(" ");

    await prisma.$transaction(async (tx) => {
      await finalizeCartOrderPayment(tx, order, session.user.id, {
        provider: PaymentProvider.PAYPAL,
        paymentReference: parsed.data.paypalOrderId,
        providerOrderId: captureResult.id,
        payerEmail: captureResult.payer?.email_address || captureResult.payment_source?.paypal?.email_address || null,
        payerName: payerName || null,
        paymentMethodType: captureResult.payment_source?.card ? "card" : "paypal",
        cardBrand: captureResult.payment_source?.card?.brand || null,
        cardLast4: captureResult.payment_source?.card?.last_digits || null,
        countryCode: captureResult.payer?.address?.country_code || null,
        notes: `PayPal checkout completed for: ${describeSellerCoverage(order)}`,
      });
    });

    return NextResponse.json({ success: true });
  }

  let stripeSession;

  try {
    stripeSession = await getStripeCheckoutSession(parsed.data.stripeSessionId!);
  } catch {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: localOrderId },
        data: { paymentState: "Failed" },
      });
      await tx.paymentRecord.updateMany({
        where: { orderId: localOrderId },
        data: { status: "Failed" },
      });
      await tx.errorLog.create({
        data: {
          message: "Stripe session verification failed",
          source: "api.checkout.capture",
          actorId: session.user.id,
        },
      });
    });

    return NextResponse.json({ error: "Card payment verification failed" }, { status: 502 });
  }

  if (stripeSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Card payment is not completed yet" }, { status: 400 });
  }

  if (stripeSession.metadata?.localOrderId !== localOrderId) {
    return NextResponse.json({ error: "Order validation failed" }, { status: 400 });
  }

  const paymentIntent =
    stripeSession.payment_intent && typeof stripeSession.payment_intent !== "string"
      ? stripeSession.payment_intent
      : null;
  const charge = paymentIntent?.latest_charge;
  const providerPaymentId = typeof charge === "string" ? charge : null;

  await prisma.$transaction(async (tx) => {
    await finalizeCartOrderPayment(tx, order, session.user.id, {
      provider: PaymentProvider.STRIPE,
      paymentReference: stripeSession.id,
      providerSessionId: stripeSession.id,
      providerPaymentId,
      payerEmail: stripeSession.customer_details?.email || session.user.email || null,
      payerName: stripeSession.customer_details?.name || null,
      paymentMethodType: "card",
      cardBrand: null,
      cardLast4: null,
      countryCode: stripeSession.customer_details?.address?.country || null,
      receiptUrl: null,
      notes: `Card checkout completed for: ${describeSellerCoverage(order)}`,
    });
  });

  return NextResponse.json({ success: true });
}
