import { PaymentProvider, PaymentState, Prisma } from "@prisma/client";

type OrderForCompletion = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            title: true;
          };
        };
      };
    };
    paymentRecord: true;
  };
}>;

type FinalizeCartOrderInput = {
  provider: PaymentProvider;
  paymentReference?: string | null;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerPaymentId?: string | null;
  payerEmail?: string | null;
  payerName?: string | null;
  paymentMethodType?: string | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  countryCode?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
};

export async function finalizeCartOrderPayment(
  tx: Prisma.TransactionClient,
  order: OrderForCompletion,
  userId: string,
  input: FinalizeCartOrderInput
) {
  const capturedAt = new Date();

  for (const item of order.items) {
    const existingPurchase = await tx.purchase.findFirst({
      where: {
        userId,
        productId: item.productId,
        status: "active",
      },
      select: { id: true },
    });

    if (!existingPurchase) {
      await tx.purchase.create({
        data: {
          userId,
          productId: item.productId,
          status: "active",
        },
      });
    }
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: "Completed",
      paymentProvider: input.provider,
      paymentState: "Paid",
      paymentReference: input.paymentReference || input.providerPaymentId || input.providerOrderId || input.providerSessionId || null,
      paymentCapturedAt: capturedAt,
    },
  });

  await tx.paymentRecord.upsert({
    where: { orderId: order.id },
    update: {
      provider: input.provider,
      status: PaymentState.Paid,
      providerOrderId: input.providerOrderId || null,
      providerSessionId: input.providerSessionId || null,
      providerPaymentId: input.providerPaymentId || null,
      payerEmail: input.payerEmail || null,
      payerName: input.payerName || null,
      paymentMethodType: input.paymentMethodType || null,
      cardBrand: input.cardBrand || null,
      cardLast4: input.cardLast4 || null,
      countryCode: input.countryCode || null,
      receiptUrl: input.receiptUrl || null,
      notes: input.notes || null,
    },
    create: {
      orderId: order.id,
      provider: input.provider,
      status: PaymentState.Paid,
      amountCents: order.totalCents,
      currencyCode: order.currencyCode,
      providerOrderId: input.providerOrderId || null,
      providerSessionId: input.providerSessionId || null,
      providerPaymentId: input.providerPaymentId || null,
      payerEmail: input.payerEmail || null,
      payerName: input.payerName || null,
      paymentMethodType: input.paymentMethodType || null,
      cardBrand: input.cardBrand || null,
      cardLast4: input.cardLast4 || null,
      countryCode: input.countryCode || null,
      receiptUrl: input.receiptUrl || null,
      notes: input.notes || null,
    },
  });

  await tx.cartItem.deleteMany({ where: { userId } });

  await tx.user.update({
    where: { id: userId },
    data: {
      hasActivePack: true,
    },
  });

  await tx.notification.create({
    data: {
      userId,
      title: "Payment successful",
      message: `${input.provider === PaymentProvider.STRIPE ? "Card" : "PayPal"} payment captured and your order is now active.`,
    },
  });

  await tx.auditLog.create({
    data: {
      action: `checkout.${input.provider.toLowerCase()}.capture`,
      target: order.id,
      details:
        input.notes ||
        `${input.provider} payment completed for ${order.items.length} item(s). Reference: ${input.paymentReference || input.providerPaymentId || input.providerOrderId || input.providerSessionId || "n/a"}`,
      actorId: userId,
    },
  });
}

export function describeSellerCoverage(order: OrderForCompletion) {
  const sellerFacingTitles = order.items.map((item) => item.product.title);
  return sellerFacingTitles.join(", ");
}
