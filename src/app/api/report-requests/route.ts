import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { createReportRequestNumber, reportRequestSchema } from "@/lib/report-requests";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("reportRequestsCreate");
    const payload = reportRequestSchema.parse(await request.json());
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, agency: { select: { name: true } } }
    });

    const created = await prisma.reportRequest.create({
      data: {
        requestNumber: createReportRequestNumber(),
        title: payload.title,
        details: payload.details,
        requesterId: account?.id ?? null,
        requesterName: account?.name ?? user.name ?? null,
        requesterEmail: account?.email ?? user.email ?? null,
        requesterRole: account?.role ?? user.role,
        requesterBank: account?.role === Role.BANK ? account.agency?.name ?? account.name ?? user.email ?? null : account?.agency?.name ?? null
      },
      select: { id: true, requestNumber: true }
    });

    await writeAuditLog({
      userId: account?.id ?? null,
      role: user.role,
      action: "REPORT_REQUEST_CREATED",
      entity: "ReportRequest",
      entityId: created.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: created.requestNumber, title: payload.title }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
