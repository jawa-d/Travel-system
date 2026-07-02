import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

const termsSchema = z.object({
  html: z.string().trim().max(20000),
  approve: z.boolean().optional()
});

function canEditTerms(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.UNDERWRITER;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canEditTerms(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const payload = termsSchema.parse(await request.json());
    const approving = payload.approve === true;
    if (approving && user.role !== Role.SUPER_ADMIN) return NextResponse.json({ error: "Only General Manager can approve terms." }, { status: 403 });

    const updated = await prisma.motorInsuranceRequest.update({
      where: { id },
      data: {
        policyTermsHtml: payload.html || null,
        termsApprovedById: approving ? user.id : undefined,
        termsApprovedByName: approving ? user.name ?? user.email ?? "General Manager" : undefined,
        termsApprovedAt: approving ? new Date() : undefined
      }
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: approving ? "MOTOR_REQUEST_TERMS_APPROVED" : "MOTOR_REQUEST_TERMS_UPDATED",
      entity: "MotorInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber }
    });
    return NextResponse.json({ success: true, terms: updated });
  } catch (error) {
    return jsonError(error);
  }
}
