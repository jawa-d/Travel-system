import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { jsonError, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({ role: z.nativeEnum(Role) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePermission("systemManage");
    const { id } = await params;
    if (manager.id === id) return NextResponse.json({ error: "لا يمكنك تغيير صلاحية حسابك الحالي" }, { status: 400 });

    const data = updateUserSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: { id: true, name: true, email: true, role: true, active: true }
    });
    return NextResponse.json(user);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePermission("systemManage");
    const { id } = await params;
    if (manager.id === id) return NextResponse.json({ error: "لا يمكنك حذف حسابك الحالي" }, { status: 400 });

    await prisma.user.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
