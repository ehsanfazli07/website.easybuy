import { prisma } from "@/lib/prisma";

type CreatePaypalOrderInput = {
  totalCents: number;
  localOrderId: string;
  returnUrl: string;
  cancelUrl: string;
};

type PayPalTokenResponse = {
  access_token: string;
};

type PayPalLink = {
  rel: string;
  href: string;
};

type CreateOrderResponse = {
  id: string;
  status: string;
  links?: PayPalLink[];
};

type CaptureOrderResponse = {
  id: string;
  status: string;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
    address?: {
      country_code?: string;
    };
  };
  purchase_units?: Array<{ custom_id?: string }>;
  payment_source?: {
    paypal?: {
      email_address?: string;
      account_id?: string;
    };
    card?: {
      last_digits?: string;
      brand?: string;
      type?: string;
    };
  };
};

function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAdminPayPalReceiverEmail() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "creatorProfile" },
      select: { value: true },
    });

    if (!setting?.value) {
      return null;
    }

    const parsed = JSON.parse(setting.value) as { paypalReceiverEmail?: string };
    const value = parsed.paypalReceiverEmail?.trim().toLowerCase();

    if (!value || !value.includes("@")) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

async function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const adminReceiverEmail = await getAdminPayPalReceiverEmail();
  const receiverEmail = adminReceiverEmail || process.env.PAYPAL_RECEIVER_EMAIL;

  if (!clientId || !clientSecret || !receiverEmail) {
    throw new Error("Missing PayPal environment configuration");
  }

  return { clientId, clientSecret, receiverEmail };
}

async function getAccessToken(config: { clientId: string; clientSecret: string }) {
  const { clientId, clientSecret } = config;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch PayPal access token");
  }

  const body = (await response.json()) as PayPalTokenResponse;
  if (!body.access_token) {
    throw new Error("PayPal access token missing in response");
  }

  return body.access_token;
}

export async function createPaypalOrder(input: CreatePaypalOrderInput) {
  const config = await getPayPalConfig();
  const token = await getAccessToken(config);
  const receiverEmail = config.receiverEmail;
  const totalUsd = (input.totalCents / 100).toFixed(2);

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `easybuy-${input.localOrderId}`,
    },
    cache: "no-store",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.localOrderId,
          amount: {
            currency_code: "USD",
            value: totalUsd,
          },
          payee: {
            email_address: receiverEmail,
          },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!response.ok) {
    throw new Error("PayPal order creation failed");
  }

  const body = (await response.json()) as CreateOrderResponse;
  const approveUrl = body.links?.find((item) => item.rel === "approve")?.href;

  if (!body.id || !approveUrl) {
    throw new Error("PayPal order response incomplete");
  }

  return {
    paypalOrderId: body.id,
    status: body.status,
    approveUrl,
  };
}

export async function capturePaypalOrder(paypalOrderId: string) {
  const config = await getPayPalConfig();
  const token = await getAccessToken(config);

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("PayPal capture failed");
  }

  const body = (await response.json()) as CaptureOrderResponse;
  return body;
}
