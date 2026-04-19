import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export async function POST(
  _request: Request,
  _context: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Direct purchase is disabled. Add the item to cart and use the secure checkout." },
    { status: 410 }
  );
}
