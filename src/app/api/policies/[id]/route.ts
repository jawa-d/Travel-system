import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createSystemNotification } from "@/lib/notifications";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoPolicies, updateDemoPolicyStatus, type DemoPolicyStatus } from "@/lib/demo-policy-store";
import { canAccessPolicy } from "@/lib/policy-access";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const policy = getDemoPolicies().find((item) => item.id === id);
    return policy
      ? NextResponse.json(policy)
      : NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }
  const user = await requireUser();
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true }
  });
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  if (!canAccessPolicy(user, policy)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(policy);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (body.action === "restore") {
      if (isDirectAccessEnabled()) return NextResponse.json({ error: "Not available in demo mode" }, { status: 400 });
      const user = await requirePermission("policiesDelete");
      const policy = await prisma.policy.update({
        where: { id },
        data: { deletedAt: null, deletedBy: null }
      });
      await writeAuditLog({
        userId: user.id, role: user.role, action: "POLICY_RESTORED", entity: "Policy",
        entityId: policy.id, ipAddress: getIpAddress(request.headers), metadata: { policyNumber: policy.policyNumber }
      });
      return NextResponse.json(policy);
    }
    const allowedStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"] as const;
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "حالة الوثيقة غير صحيحة" }, { status: 400 });
    }
    if (isDirectAccessEnabled()) {
      const policy = updateDemoPolicyStatus(id, body.status as DemoPolicyStatus);
      if (!policy) return NextResponse.json({ error: "الوثيقة غير موجودة" }, { status: 404 });
      return NextResponse.json(policy);
    }
    const user = await requirePermission("policiesManage");
    const policy = await prisma.policy.update({ where: { id }, data: { status: body.status } });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: body.status === "CANCELLED" ? "POLICY_CANCELLED" : "POLICY_UPDATED",
      entity: "Policy",
      entityId: policy.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { status: body.status }
    });
    await createSystemNotification({
      userId: user.id,
      title: body.status === "CANCELLED" ? "Policy cancelled" : "Policy updated",
      message: `Policy ${policy.policyNumber} status changed to ${body.status}`,
      entity: "Policy",
      entityId: policy.id
    });
    return NextResponse.json(policy);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission("policiesDelete");
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";
    const policy = await prisma.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, policyNumber: true, deletedAt: true }
    });

    if (!permanent) {
      const deleted = await prisma.policy.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: user.id }
      });
      await writeAuditLog({
        userId: user.id, role: user.role, action: "POLICY_DELETED", entity: "Policy",
        entityId: id, ipAddress: getIpAddress(request.headers), metadata: { policyNumber: policy.policyNumber, permanent: false }
      });
      return NextResponse.json(deleted);
    }

    if (!policy.deletedAt) {
      return NextResponse.json({ error: "يجب حذف الوثيقة أولاً قبل الحذف النهائي" }, { status: 409 });
    }
    await writeAuditLog({
      userId: user.id, role: user.role, action: "POLICY_PERMANENTLY_DELETED", entity: "Policy",
      entityId: id, ipAddress: getIpAddress(request.headers), metadata: { policyNumber: policy.policyNumber, permanent: true }
    });
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { entity: "Policy", entityId: id } }),
      prisma.claim.deleteMany({ where: { policyId: id } }),
      prisma.endorsement.deleteMany({ where: { policyId: id } }),
      prisma.cancellation.deleteMany({ where: { policyId: id } }),
      prisma.policy.delete({ where: { id } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
