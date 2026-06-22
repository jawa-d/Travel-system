import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { claimSchema } from "@/lib/validators";
import { createSequence } from "@/lib/numbers";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createSystemNotification } from "@/lib/notifications";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { createDemoClaim, getDemoClaims } from "@/lib/demo-claim-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { canAccessPolicy, visiblePolicyWhere } from "@/lib/policy-access";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoClaims());
  const user = await requireUser();
  const claims = await prisma.claim.findMany({
    where: { policy: visiblePolicyWhere(user) },
    include: { policy: true, customer: true, createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json(claims);
}

export async function POST(request: NextRequest) {
  try {
    const data = claimSchema.parse(await request.json());
    if (isDirectAccessEnabled()) {
      const policy = getDemoPolicies().find((item) => item.policyNumber === data.policyNumber);
      if (!policy) return NextResponse.json({ error: "الوثيقة غير موجودة" }, { status: 404 });
      const claim = createDemoClaim({
        policy: { id: policy.id, policyNumber: policy.policyNumber },
        customer: { id: policy.customer.id, arabicName: policy.customer.arabicName },
        claimType: data.claimType as Parameters<typeof createDemoClaim>[0]["claimType"],
        description: data.description,
        attachments: data.attachments,
        status: data.status
      });
      return NextResponse.json(claim, { status: 201 });
    }
    const user = await requirePermission("claimsWrite");
    const policy = await prisma.policy.findUniqueOrThrow({ where: { policyNumber: data.policyNumber } });
    if (!canAccessPolicy(user, policy) || policy.deletedAt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const claim = await prisma.claim.create({
      data: {
        claimNumber: createSequence("CLM"),
        policyId: policy.id,
        customerId: policy.customerId,
        claimType: data.claimType,
        description: data.description,
        attachments: data.attachments,
        status: data.status,
        createdById: user.id
      },
      include: { policy: true, customer: true }
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "CLAIM_CREATED",
      entity: "Claim",
      entityId: claim.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { claimNumber: claim.claimNumber }
    });
    await createSystemNotification({
      userId: user.id,
      title: "New claim",
      message: `Claim ${claim.claimNumber} was created`,
      entity: "Claim",
      entityId: claim.id
    });
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
