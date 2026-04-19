import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { hasAdminAccess } from "@/lib/route-security";

const hits = new Map<string, { count: number; ts: number }>();

function simpleRateLimit(key: string, limit = 25, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);

  if (!current || now - current.ts > windowMs) {
    hits.set(key, { count: 1, ts: now });
    return false;
  }

  current.count += 1;
  hits.set(key, current);

  return current.count > limit;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiAdminPath = pathname.startsWith("/api/admin");

  const securityHeaders = new Headers({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown-ip";

  if (
    pathname.startsWith("/api/purchase") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/cart") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/follow")
  ) {
    const limit = pathname.startsWith("/api/admin") ? 8 : 15;
    if (simpleRateLimit(`${ip}:${pathname}`, limit, 60_000)) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: securityHeaders,
      });
    }
  }

  let token: Awaited<ReturnType<typeof getToken>> = null;

  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    token = null;
  }

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!token.hasActivePack) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/admin") || isApiAdminPath) {
    const adminEmail = typeof token?.email === "string" ? token.email : null;
    const adminRole = typeof token?.role === "string" ? token.role : null;

    if (!token || !hasAdminAccess(adminRole, adminEmail)) {
      if (isApiAdminPath) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: securityHeaders });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isApiAdminPath) {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const origin = request.headers.get("origin");
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "http";
      let requestOrigin: string | null = null;
      let hostOrigin: string | null = null;
      let appOrigin: string | null = null;

      try {
        requestOrigin = origin ? new URL(origin).origin : null;
      } catch {
        requestOrigin = null;
      }

      try {
        hostOrigin = host ? new URL(`${proto}://${host}`).origin : null;
      } catch {
        hostOrigin = null;
      }

      try {
        appOrigin = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).origin : null;
      } catch {
        appOrigin = null;
      }

      if (!requestOrigin || (requestOrigin !== hostOrigin && requestOrigin !== appOrigin)) {
        return NextResponse.json(
          { error: "Cross-origin mutation blocked" },
          { status: 403, headers: securityHeaders }
        );
      }
    }
  }

  if (
    pathname.startsWith("/sell") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/api/cart") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/follow")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/sell/:path*",
    "/cart/:path*",
    "/api/admin/:path*",
    "/api/purchase/:path*",
    "/api/cart/:path*",
    "/api/checkout/:path*",
    "/api/follow/:path*",
  ],
};
