import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { jsonError, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateAgentSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(100).optional()
}).refine((data) => Object.keys(data).length > 0, "لا توجد تغييرات للحفظ");

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePermission("agentsManage");
    const { id } = await params;
    const data = updateAgentSchema.parse(await request.json());
    const existing = await prisma.user.findFirst({ where: { id, role: Role.AGENT } });
    if (!existing) {
      return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404 });
    }

    const agent = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        active: data.active,
        passwordHash: data.password ? await bcrypt.hash(data.password, 12) : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        _count: { select: { policies: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: manager.id,
        role: manager.role,
        action: data.password ? "AGENT_PASSWORD_RESET" : data.active === undefined ? "AGENT_UPDATED" : data.active ? "AGENT_ACTIVATED" : "AGENT_DEACTIVATED",
        entity: "User",
        entityId: id,
        metadata: { email: agent.email }
      }
    });

    return NextResponse.json(agent);
  } catch (error) {
    return jsonError(error);
  }
}
