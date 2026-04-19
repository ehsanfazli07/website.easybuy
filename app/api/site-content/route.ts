import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
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
    websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://easybuystores.com",
    easybuyFacebookUrl: "https://www.facebook.com/share/1bK2X5qKMM/",
    creatorInstagramUrl: "https://www.instagram.com/__.ehsan_fazli.__?igsh=MTN3MW5pdTNneTRibQ==",
    creatorFacebookUrl: "https://www.facebook.com/share/1KLkuZoLH1/",
    paypalHostedButtonId: process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID || "",
    paypalHostedAction:
      process.env.NEXT_PUBLIC_PAYPAL_HOSTED_ACTION || "https://www.paypal.com/cgi-bin/webscr",
    links: [] as string[],
  };

  if (!setting?.value) {
    return NextResponse.json(fallback);
  }

  try {
    const parsed = JSON.parse(setting.value) as {
      name?: string;
      phone?: string;
      about?: string;
      websiteUrl?: string;
      easybuyFacebookUrl?: string;
      creatorInstagramUrl?: string;
      creatorFacebookUrl?: string;
      paypalHostedButtonId?: string;
      paypalHostedAction?: string;
      links?: string[];
    };

    return NextResponse.json({
      creatorName: parsed.name || fallback.creatorName,
      creatorPhone: parsed.phone || fallback.creatorPhone,
      creatorAbout: parsed.about || fallback.creatorAbout,
      websiteUrl: parsed.websiteUrl || fallback.websiteUrl,
      easybuyFacebookUrl: parsed.easybuyFacebookUrl || fallback.easybuyFacebookUrl,
      creatorInstagramUrl: parsed.creatorInstagramUrl || fallback.creatorInstagramUrl,
      creatorFacebookUrl: parsed.creatorFacebookUrl || fallback.creatorFacebookUrl,
      paypalHostedButtonId: parsed.paypalHostedButtonId || fallback.paypalHostedButtonId,
      paypalHostedAction: parsed.paypalHostedAction || fallback.paypalHostedAction,
      links: Array.isArray(parsed.links) ? parsed.links : fallback.links,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}