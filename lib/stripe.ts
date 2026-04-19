import Stripe from "stripe";

type StripeCartItem = {
  quantity: number;
  product: {
    title: string;
    description: string;
    priceCents: number;
  };
};

type CreateStripeCheckoutSessionInput = {
  localOrderId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  shippingCostCents: number;
  cartItems: StripeCartItem[];
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutSessionInput) {
  const stripe = getStripeClient();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.cartItems.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      unit_amount: item.product.priceCents,
      product_data: {
        name: item.product.title,
        description: item.product.description.slice(0, 400),
      },
    },
  }));

  if (input.shippingCostCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: input.shippingCostCents,
        product_data: {
          name: "Shipping",
          description: "Order delivery charge",
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail || undefined,
    billing_address_collection: "auto",
    payment_method_types: ["card"],
    metadata: {
      localOrderId: input.localOrderId,
      checkoutSource: "cart",
    },
    line_items: lineItems,
  });

  if (!session.url) {
    throw new Error("Stripe checkout URL missing");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export async function getStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}
