import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error("Missing ADMIN_EMAIL env var.");
  }

  if (!password) {
    throw new Error("Missing ADMIN_PASSWORD env var.");
  }

  const passwordHash = await hash(password, 12);

  const normalizedEmail = adminEmail.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  let user;

  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        hasActivePack: true,
        passwordHash,
      },
    });
  } else {
    const emailLocal = normalizedEmail.split("@")[0] || "admin";
    let candidate = emailLocal.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "admin";

    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (taken) {
      candidate = `${candidate}_${Date.now().toString().slice(-6)}`;
    }

    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: "Admin",
        username: candidate,
        role: "ADMIN",
        hasActivePack: true,
        passwordHash,
        bio: "Marketplace administrator",
      },
    });
  }

  console.log(`ADMIN_READY:${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
