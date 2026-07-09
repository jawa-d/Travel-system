import { NextRequest, NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { updateDemoClaimStatus, type DemoClaimStatus } from "@/lib/demo-claim-store";
import { canAccessPolicy } from "@/lib/policy-access";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { isWorkflowStatus, validateWorkflowTransition } from "@/lib/workflow-status";

const updateClaimSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED"])
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("claimsRead");
  const { id } = await params;
  const claim = await prisma.claim.findUnique({ where: { id }, include: { policy: true, customer: true } });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (!canAccessPolicy(user, claim.policy)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(claim);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = updateClaimSchema.parse(await request.json());
    if (!isWorkflowStatus(body.status)) return NextResponse.json({ error: "حالة المطالبة غير صحيحة" }, { status: 400 });
    const status = body.status as ClaimStatus;
    if (isDirectAccessEnabled()) {
      const claim = updateDemoClaimStatus(id, status as DemoClaimStatus);
      if (!claim) return NextResponse.json({ error: "المطالبة غير موجودة" }, { status: 404 });
      if (claim === "FINALIZED") return NextResponse.json({ error: "This claim is finalized and cannot be modified." }, { status: 409 });
      return NextResponse.json(claim);
    }
    const user = await requirePermission("claimsManage");
    const existing = await prisma.claim.findUnique({
      where: { id },
      select: { id: true, status: true, policy: { select: { issuedByUserId: true, issuedById: true, deletedAt: true } } }
    });
    if (!existing) return NextResponse.json({ error: "المطالبة غير موجودة" }, { status: 404 });
    if (!canAccessPolicy(user, existing.policy) || existing.policy.deletedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (validateWorkflowTransition(existing.status, status) === "FINALIZED") {
      return NextResponse.json({ error: "This claim is finalized and cannot be modified." }, { status: 409 });
    }
    const claim = await prisma.claim.update({ where: { id }, data: { status } });
    await writeAuditLog({
      userId: user.id, role: user.role, action: "CLAIM_STATUS_CHANGED", entity: "Claim",
      entityId: claim.id, ipAddress: getIpAddress(request.headers),
      metadata: {
        claimId: claim.id,
        previousStatus: existing.status,
        newStatus: status,
        user: user.name ?? user.email ?? user.id,
        timestamp: new Date().toISOString()
      }
    });
    return NextResponse.json(claim);
  } catch (error) {
    return jsonError(error);
  }
}
