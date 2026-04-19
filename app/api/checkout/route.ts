import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PaymentProvider } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { createPaypalOrder } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";
import { createStripeCheckoutSession } from "@/lib/stripe";

const checkoutSchema = z.object({
  shippingAddress: z.string().trim().max(500).optional().default(""),
  shippingCostCents: z.number().int().min(0).max(1_000_000).optional().default(0),
  deliveryEtaDays: z.number().int().min(1).max(60).optional().default(5),
  paymentMethod: z.enum(["paypal", "card"]).optional().default("paypal"),
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
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const { shippingAddress, shippingCostCents, deliveryEtaDays, paymentMethod } = parsed.data;
  const paymentProvider =
    paymentMethod === "card" ? PaymentProvider.STRIPE : PaymentProvider.PAYPAL;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const totalCents =
    cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0) +
    shippingCostCents;

  const sellerSummary = Array.from(
    new Set(
      cartItems
        .map((item) => item.product.seller.username || item.product.seller.name || item.product.seller.email || "Unknown seller")
        .filter(Boolean)
    )
  ).join(", ");

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        totalCents,
        status: "Pending",
        paymentProvider,
        paymentState: "Pending",
        currencyCode: "USD",
        shippingAddress: shippingAddress || null,
        shippingCostCents,
        deliveryEtaDays,
      },
    });

    await tx.paymentRecord.create({
      data: {
        orderId: newOrder.id,
        provider: paymentProvider,
        status: "Pending",
        amountCents: totalCents,
        currencyCode: "USD",
        notes: `Cart checkout started for ${cartItems.length} item(s). Sellers: ${sellerSummary || "n/a"}`,
      },
    });

    for (const item of cartItems) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.product.priceCents,
        },
      });

    }

    return newOrder;
  });

  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;

  try {
    if (paymentProvider === PaymentProvider.PAYPAL) {
      const returnUrl = `${baseUrl}/cart?paypal=success&local_order_id=${order.id}`;
      const cancelUrl = `${baseUrl}/cart?paypal=cancel&local_order_id=${order.id}`;

      const paypal = await createPaypalOrder({
        totalCents,
        localOrderId: order.id,
        returnUrl,
        cancelUrl,
      });

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentReference: paypal.paypalOrderId,
            paymentState: "Processing",
          },
        });

        await tx.paymentRecord.update({
          where: { orderId: order.id },
          data: {
            providerOrderId: paypal.paypalOrderId,
            status: "Processing",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "checkout.paypal.create",
            target: order.id,
            details: `PayPal order created: ${paypal.paypalOrderId}`,
            actorId: session.user.id,
          },
        });
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentMethod: "paypal",
        approveUrl: paypal.approveUrl,
        paypalOrderId: paypal.paypalOrderId,
      });
    }

    const stripe = await createStripeCheckoutSession({
      localOrderId: order.id,
      successUrl: `${baseUrl}/cart?stripe=success&local_order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/cart?stripe=cancel&local_order_id=${order.id}`,
      customerEmail: session.user.email,
      shippingCostCents,
      cartItems,
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentReference: stripe.sessionId,
          paymentState: "Processing",
        },
      });

      await tx.paymentRecord.update({
        where: { orderId: order.id },
        data: {
          providerSessionId: stripe.sessionId,
          status: "Processing",
          paymentMethodType: "card",
        },
      });

      await tx.auditLog.create({
        data: {
          action: "checkout.stripe.create",
          target: order.id,
          details: `Stripe checkout session created: ${stripe.sessionId}`,
          actorId: session.user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentMethod: "card",
      checkoutUrl: stripe.checkoutUrl,
      stripeSessionId: stripe.sessionId,
    });
  } catch {
    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
      await tx.errorLog.create({
        data: {
          message: `Failed to initialize ${paymentMethod === "card" ? "card" : "PayPal"} checkout`,
          source: "api.checkout",
          actorId: session.user.id,
        },
      });
    });

    return NextResponse.json(
      { error: `Unable to initialize ${paymentMethod === "card" ? "card" : "PayPal"} checkout. Try again.` },
      { status: 502 }
    );
  }
}
