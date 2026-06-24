import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get("locale"));
  const redirectTo = request.nextUrl.searchParams.get("redirectTo") ?? "/";
  const response = NextResponse.redirect(new URL(redirectTo, request.nextUrl.origin));
  response.cookies.set("locale", locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  const session = await auth();
  if (session?.user?.id) {
    prisma.user.update({ where: { id: session.user.id }, data: { localePreference: locale } }).catch(() => null);
  }
  return response;
}
