import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const themes = new Set(["light", "dark", "system"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const theme = themes.has(body.theme) ? String(body.theme) : "system";
  const response = NextResponse.json({ ok: true, theme });
  response.cookies.set("theme", theme, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { themePreference: theme } }).catch(() => null);
  }

  return response;
}
