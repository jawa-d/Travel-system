import { EngineeringRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const statusUpdateSchema = z.object({
  status: z.nativeEnum(EngineeringRequestStatus),
  managerNotes: z.string().trim().max(4000).optional().or(z.literal(""))
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("engineeringRequestsManage");
    const { id } = await params;
    const payload = statusUpdateSchema.parse(await request.json());
    const existing = await prisma.engineeringInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true, status: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.engineeringInsuranceRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        reviewedById: user.id,
        reviewedByName: user.name ?? user.email ?? "Manager",
        reviewedAt: new Date()
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_STATUS_UPDATED",
      entity: "EngineeringInsuranceRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, previousStatus: existing.status, status: updated.status }
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const existing = await prisma.engineeringInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.engineeringInsuranceRequest.delete({ where: { id } });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_DELETED",
      entity: "EngineeringInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: existing.requestNumber }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
