import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const contentSchema = z.object({
  creatorName: z.string().min(2).max(80),
  creatorPhone: z.string().min(3).max(40),
  creatorAbout: z.string().min(10).max(500),
  paypalReceiverEmail: z.string().trim().email().max(120),
  paypalHostedButtonId: z.string().trim().min(2).max(120),
  paypalHostedAction: z.string().trim().url().max(240),
  websiteUrl: z.string().trim().url().max(240).or(z.literal("")),
  easybuyFacebookUrl: z.string().trim().url().max(240).or(z.literal("")),
  creatorInstagramUrl: z.string().trim().url().max(240).or(z.literal("")),
  creatorFacebookUrl: z.string().trim().url().max(240).or(z.literal("")),
  links: z.array(z.string().url()).max(6),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const setting = await prisma.siteSetting.findUnique({
    where: { key: "creatorProfile" },
    select: { value: true },
  });

  const fallback = {
    creatorName: process.env.CREATOR_NAME || "EasyBuy Team",
    creatorPhone: process.env.CREATOR_PHONE || "Not set",
    creatorAbout:
      process.env.CREATOR_ABOUT ||
      "Marketplace profile has not been configured yet.",
    paypalReceiverEmail: process.env.PAYPAL_RECEIVER_EMAIL || "",
    paypalHostedButtonId: process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID || "",
    paypalHostedAction:
      process.env.NEXT_PUBLIC_PAYPAL_HOSTED_ACTION || "https://www.paypal.com/cgi-bin/webscr",
    websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://easybuystores.com",
    easybuyFacebookUrl: "https://www.facebook.com/share/1bK2X5qKMM/",
    creatorInstagramUrl: "https://www.instagram.com/__.ehsan_fazli.__?igsh=MTN3MW5pdTNneTRibQ==",
    creatorFacebookUrl: "https://www.facebook.com/share/1KLkuZoLH1/",
    links: [] as string[],
  };

  if (!setting) {
    return NextResponse.json(fallback);
  }

  try {
    const parsed = JSON.parse(setting.value) as {
      name?: string;
      phone?: string;
      about?: string;
      paypalReceiverEmail?: string;
      paypalHostedButtonId?: string;
      paypalHostedAction?: string;
      websiteUrl?: string;
      easybuyFacebookUrl?: string;
      creatorInstagramUrl?: string;
      creatorFacebookUrl?: string;
      links?: string[];
    };

    return NextResponse.json({
      creatorName: parsed.name || fallback.creatorName,
      creatorPhone: parsed.phone || fallback.creatorPhone,
      creatorAbout: parsed.about || fallback.creatorAbout,
      paypalReceiverEmail: parsed.paypalReceiverEmail || fallback.paypalReceiverEmail,
      paypalHostedButtonId: parsed.paypalHostedButtonId || fallback.paypalHostedButtonId,
      paypalHostedAction: parsed.paypalHostedAction || fallback.paypalHostedAction,
      websiteUrl: parsed.websiteUrl || fallback.websiteUrl,
      easybuyFacebookUrl: parsed.easybuyFacebookUrl || fallback.easybuyFacebookUrl,
      creatorInstagramUrl: parsed.creatorInstagramUrl || fallback.creatorInstagramUrl,
      creatorFacebookUrl: parsed.creatorFacebookUrl || fallback.creatorFacebookUrl,
      links: Array.isArray(parsed.links) ? parsed.links : fallback.links,
    });
  } catch {
    return NextResponse.json(fallback);
  }
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
  const parsed = contentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key: "creatorProfile" },
    update: {
      value: JSON.stringify({
        name: parsed.data.creatorName.trim(),
        phone: parsed.data.creatorPhone.trim(),
        about: parsed.data.creatorAbout.trim(),
        paypalReceiverEmail: parsed.data.paypalReceiverEmail.trim().toLowerCase(),
        paypalHostedButtonId: parsed.data.paypalHostedButtonId.trim(),
        paypalHostedAction: parsed.data.paypalHostedAction.trim(),
        websiteUrl: parsed.data.websiteUrl.trim(),
        easybuyFacebookUrl: parsed.data.easybuyFacebookUrl.trim(),
        creatorInstagramUrl: parsed.data.creatorInstagramUrl.trim(),
        creatorFacebookUrl: parsed.data.creatorFacebookUrl.trim(),
        links: parsed.data.links,
      }),
    },
    create: {
      key: "creatorProfile",
      value: JSON.stringify({
        name: parsed.data.creatorName.trim(),
        phone: parsed.data.creatorPhone.trim(),
        about: parsed.data.creatorAbout.trim(),
        paypalReceiverEmail: parsed.data.paypalReceiverEmail.trim().toLowerCase(),
        paypalHostedButtonId: parsed.data.paypalHostedButtonId.trim(),
        paypalHostedAction: parsed.data.paypalHostedAction.trim(),
        websiteUrl: parsed.data.websiteUrl.trim(),
        easybuyFacebookUrl: parsed.data.easybuyFacebookUrl.trim(),
        creatorInstagramUrl: parsed.data.creatorInstagramUrl.trim(),
        creatorFacebookUrl: parsed.data.creatorFacebookUrl.trim(),
        links: parsed.data.links,
      }),
    },
  });

  return NextResponse.json({ success: true });
}
