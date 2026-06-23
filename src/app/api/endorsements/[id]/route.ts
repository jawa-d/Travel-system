import { NextRequest, NextResponse } from "next/server";
import { EndorsementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { updateDemoEndorsementStatus, type DemoEndorsementStatus } from "@/lib/demo-endorsement-store";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { isWorkflowStatus, validateWorkflowTransition } from "@/lib/workflow-status";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!isWorkflowStatus(body.status)) return NextResponse.json({ error: "حالة الملحق غير صحيحة" }, { status: 400 });
    if (isDirectAccessEnabled()) {
      const item = updateDemoEndorsementStatus(id, body.status as DemoEndorsementStatus);
      if (!item) return NextResponse.json({ error: "الملحق غير موجود" }, { status: 404 });
      if (item === "FINALIZED") return NextResponse.json({ error: "This endorsement is finalized and cannot be modified." }, { status: 409 });
      return NextResponse.json(item);
    }
    const user = await requirePermission("endorsementsWrite");
    const existing = await prisma.endorsement.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) return NextResponse.json({ error: "الملحق غير موجود" }, { status: 404 });
    if (validateWorkflowTransition(existing.status, body.status) === "FINALIZED") {
      return NextResponse.json({ error: "This endorsement is finalized and cannot be modified." }, { status: 409 });
    }
    const item = await prisma.endorsement.update({
      where: { id },
      data: { status: body.status as EndorsementStatus }
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENDORSEMENT_STATUS_CHANGED",
      entity: "Endorsement",
      entityId: item.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        endorsementId: item.id,
        previousStatus: existing.status,
        newStatus: body.status,
        user: user.name ?? user.email ?? user.id,
        timestamp: new Date().toISOString()
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return jsonError(error);
  }
}
