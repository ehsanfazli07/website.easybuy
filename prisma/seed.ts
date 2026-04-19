import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Normalize legacy role values from older schemas.
  await prisma.$executeRawUnsafe(
    'UPDATE "User" SET "role" = \'CUSTOMER\' WHERE "role" = \'BUYER\''
  );

  const adminEmail = process.env.ADMIN_EMAIL || "info@easybuystores.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      hasActivePack: true,
      username: "admin",
      bio: "Marketplace administrator",
    },
    create: {
      email: adminEmail,
      name: "Admin",
      username: "admin",
      role: "ADMIN",
      hasActivePack: true,
      bio: "Marketplace administrator",
      address: "Kabul, Afghanistan",
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "creatorProfile" },
    update: {},
    create: {
      key: "creatorProfile",
      value: JSON.stringify({
        name: process.env.CREATOR_NAME || "EasyBuy Team",
        phone: process.env.CREATOR_PHONE || "Not set",
        about: process.env.CREATOR_ABOUT || "Marketplace profile has not been configured yet.",
        paypalReceiverEmail: process.env.PAYPAL_RECEIVER_EMAIL || "",
        websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://easybuystores.com",
        easybuyFacebookUrl: "https://www.facebook.com/share/1bK2X5qKMM/",
        creatorInstagramUrl: "https://www.instagram.com/__.ehsan_fazli.__?igsh=MTN3MW5pdTNneTRibQ==",
        creatorFacebookUrl: "https://www.facebook.com/share/1KLkuZoLH1/",
        links: [],
      }),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
