import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  labelAr: z.string().trim().min(1).max(120).optional(),
  labelEn: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("lookupsManage");
    const { id } = await params;
    const value = await prisma.lookupValue.update({ where: { id }, data: updateSchema.parse(await request.json()) });
    await writeAuditLog({
      userId: user.id, role: user.role, action: "LOOKUP_UPDATED", entity: "LookupValue",
      entityId: id, ipAddress: getIpAddress(request.headers), metadata: { category: value.category, value: value.value }
    });
    return NextResponse.json(value);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("lookupsManage");
    const { id } = await params;
    const current = await prisma.lookupValue.findUniqueOrThrow({ where: { id } });
    if (current.system) return NextResponse.json({ error: "لا يمكن حذف قيمة نظامية؛ يمكن تعطيلها فقط" }, { status: 409 });
    await prisma.lookupValue.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id, role: user.role, action: "LOOKUP_DELETED", entity: "LookupValue",
      entityId: id, ipAddress: getIpAddress(request.headers), metadata: { category: current.category, value: current.value }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
