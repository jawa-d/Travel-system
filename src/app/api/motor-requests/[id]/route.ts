import { MotorRequestStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const statusUpdateSchema = z.object({
  status: z.nativeEnum(MotorRequestStatus),
  managerNotes: z.string().trim().max(4000).optional().or(z.literal(""))
}).refine((data) => data.status !== MotorRequestStatus.DRAFT, {
  message: "Draft status cannot be assigned from management."
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("motorRequestsManage");
    const { id } = await params;
    const payload = statusUpdateSchema.parse(await request.json());
    const existing = await prisma.motorInsuranceRequest.findUnique({
      where: { id },
      select: { id: true, requestNumber: true, status: true }
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.motorInsuranceRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        reviewedById: user.id,
        reviewedByName: user.name ?? user.email ?? "Manager",
        reviewedAt: new Date()
      },
      select: {
        id: true,
        requestNumber: true,
        status: true,
        managerNotes: true,
        reviewedByName: true,
        reviewedAt: true
      }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "MOTOR_REQUEST_STATUS_UPDATED",
      entity: "MotorInsuranceRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        requestNumber: updated.requestNumber,
        previousStatus: existing.status,
        status: updated.status
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}
