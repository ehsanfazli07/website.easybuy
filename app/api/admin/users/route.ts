import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const updateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]).optional(),
  hasActivePack: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      hasActivePack: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
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
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { userId, role, hasActivePack } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role ? { role } : {}),
      ...(typeof hasActivePack === "boolean" ? { hasActivePack } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
