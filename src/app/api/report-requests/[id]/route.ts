import { NextRequest, NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { reportRequestUpdateSchema } from "@/lib/report-requests";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("reportRequestsManage");
    const { id } = await params;
    const payload = reportRequestUpdateSchema.parse(await request.json());
    const reviewer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, role: true }
    });

    const updated = await prisma.reportRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        reviewedById: reviewer?.id ?? null,
        reviewedByName: reviewer?.name ?? user.name ?? null,
        reviewedAt: new Date()
      },
      select: { id: true, requestNumber: true, status: true }
    });

    await writeAuditLog({
      userId: reviewer?.id ?? null,
      role: reviewer?.role ?? user.role,
      action: "REPORT_REQUEST_UPDATED",
      entity: "ReportRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, status: updated.status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}
