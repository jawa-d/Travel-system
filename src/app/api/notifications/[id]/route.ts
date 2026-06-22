import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { markDemoNotificationRead } from "@/lib/demo-notification-store";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const notification = markDemoNotificationRead(id);
    if (!notification) return NextResponse.json({ error: "الإشعار غير موجود" }, { status: 404 });
    return NextResponse.json(notification);
  }

  const user = await requireUser();
  const notification = await prisma.notification.findFirst({
    where: { id, OR: [{ userId: user.id }, { userId: null }] }
  });
  if (!notification) return NextResponse.json({ error: "الإشعار غير موجود" }, { status: 404 });
  return NextResponse.json(await prisma.notification.update({
    where: { id },
    data: { status: "READ" }
  }));
}
