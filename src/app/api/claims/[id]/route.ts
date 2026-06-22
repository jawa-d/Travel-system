import { NextRequest, NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { updateDemoClaimStatus, type DemoClaimStatus } from "@/lib/demo-claim-store";
import { canAccessPolicy } from "@/lib/policy-access";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const claim = await prisma.claim.findUnique({ where: { id }, include: { policy: true, customer: true } });
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (!canAccessPolicy(user, claim.policy)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(claim);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status as ClaimStatus;
    const allowed = ["NEW", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED"];
    if (!allowed.includes(status)) return NextResponse.json({ error: "حالة المطالبة غير صحيحة" }, { status: 400 });
    if (isDirectAccessEnabled()) {
      const claim = updateDemoClaimStatus(id, status as DemoClaimStatus);
      if (!claim) return NextResponse.json({ error: "المطالبة غير موجودة" }, { status: 404 });
      return NextResponse.json(claim);
    }
    const user = await requirePermission("claimsManage");
    const claim = await prisma.claim.update({ where: { id }, data: { status } });
    await writeAuditLog({
      userId: user.id, role: user.role, action: "CLAIM_UPDATED", entity: "Claim",
      entityId: claim.id, ipAddress: getIpAddress(request.headers), metadata: { status }
    });
    return NextResponse.json(claim);
  } catch (error) {
    return jsonError(error);
  }
}
