import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { directAccessUser } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(10, "كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل")
    .max(100)
    .regex(/[a-z]/, "يجب أن تحتوي كلمة المرور على حرف إنجليزي صغير")
    .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف إنجليزي كبير")
    .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم")
}).refine((value) => value.currentPassword !== value.newPassword, {
  path: ["newPassword"],
  message: "كلمة المرور الجديدة يجب أن تختلف عن الحالية"
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    if (user.id === directAccessUser.id) {
      return NextResponse.json({ error: "لا يمكن تغيير كلمة مرور وضع العرض" }, { status: 400 });
    }

    const limit = rateLimit(`password-change:${user.id}`, 5, 15 * 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: `محاولات كثيرة. حاول مجددًا بعد ${limit.retryAfter} ثانية` },
        { status: 429 }
      );
    }

    const data = passwordSchema.parse(await request.json());
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, role: true }
    });
    if (!account?.passwordHash || !(await bcrypt.compare(data.currentPassword, account.passwordHash))) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 12) }
    });
    await writeAuditLog({
      userId: user.id,
      role: account.role,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: user.id,
      ipAddress: getIpAddress(request.headers)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
