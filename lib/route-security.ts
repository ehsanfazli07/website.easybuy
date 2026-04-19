import { NextResponse } from "next/server";

const DEFAULT_ADMIN_EMAIL = "info@easybuystores.com";

function normalizeOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getAllowedAdminEmails() {
  return new Set([DEFAULT_ADMIN_EMAIL]);
}

export function isAllowedAdminEmail(email?: string | null) {
  const allowList = getAllowedAdminEmails();
  return allowList.has((email || "").trim().toLowerCase());
}

export function hasAdminAccess(role?: string | null, email?: string | null) {
  void role;
  return isAllowedAdminEmail(email);
}

export function enforceSameOriginMutation(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  if (!requestOrigin) {
    return NextResponse.json({ error: "Missing Origin header" }, { status: 403 });
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const hostOrigin = host ? normalizeOrigin(`${proto}://${host}`) : null;
  const appOrigin = normalizeOrigin(process.env.NEXTAUTH_URL || null);

  if (requestOrigin !== hostOrigin && requestOrigin !== appOrigin) {
    return NextResponse.json({ error: "Cross-origin mutation blocked" }, { status: 403 });
  }

  return null;
}
