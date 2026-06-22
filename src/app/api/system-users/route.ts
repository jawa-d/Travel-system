import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { jsonError, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "اسم المستخدم مطلوب").max(100),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(100),
  role: z.nativeEnum(Role)
});

export async function POST(request: NextRequest) {
  try {
    await requirePermission("systemManage");
    const data = createUserSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقًا" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: data.role,
        active: true
      },
      select: { id: true, name: true, email: true, role: true, active: true }
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
