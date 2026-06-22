import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { buildExpiryNotificationsPreview } from "@/lib/notifications";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoNotifications, markAllDemoNotificationsRead } from "@/lib/demo-notification-store";

export async function GET() {
  if (isDirectAccessEnabled()) {
    return NextResponse.json({ notifications: getDemoNotifications(), expiryPreview: [] });
  }
  const user = await requireUser();
  const [notifications, expiryPreview] = await Promise.all([
    prisma.notification.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    buildExpiryNotificationsPreview()
  ]);
  return NextResponse.json({ notifications, expiryPreview });
}

export async function PATCH() {
  if (isDirectAccessEnabled()) {
    return NextResponse.json(markAllDemoNotificationsRead());
  }
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: {
      OR: [{ userId: user.id }, { userId: null }],
      status: { not: "READ" }
    },
    data: { status: "READ" }
  });
  return NextResponse.json({ ok: true });
}
