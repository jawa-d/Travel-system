import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { jsonError, requirePermission } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

const agentSchema = z.object({
  name: z.string().trim().min(3, "اسم الوكيل يجب أن يكون 3 أحرف على الأقل").max(100),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(100)
});

async function requireAgentManager() {
  const session = await auth();
  if (isDirectAccessEnabled() && !session?.user) return;
  await requirePermission("agentsManage");
}

export async function GET() {
  try {
    await requireAgentManager();
    const agents = await prisma.user.findMany({
      where: { role: Role.AGENT },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(agents);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAgentManager();
    const data = agentSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقًا" }, { status: 409 });

    const agent = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: Role.AGENT
      },
      select: { id: true, name: true, email: true, active: true, createdAt: true }
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
