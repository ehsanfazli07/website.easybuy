import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { enforceSameOriginMutation } from "@/lib/route-security";

const errorSchema = z.object({
  message: z.string().min(3).max(300),
  source: z.string().min(2).max(120),
  stack: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  const originError = enforceSameOriginMutation(request);
  if (originError) {
    return originError;
  }

  const { error, session } = await requireAdminSession();
  if (error || !session?.user?.id) {
    return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = errorSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.errorLog.create({
    data: {
      message: parsed.data.message,
      source: parsed.data.source,
      stack: parsed.data.stack,
      actorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
