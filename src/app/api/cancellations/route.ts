import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { cancellationSchema } from "@/lib/validators";
import { createSequence } from "@/lib/numbers";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createSystemNotification } from "@/lib/notifications";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { createDemoCancellation, getDemoCancellations } from "@/lib/demo-cancellation-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { visiblePolicyWhere } from "@/lib/policy-access";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoCancellations());
  const user = await requireUser();
  const cancellations = await prisma.cancellation.findMany({
    where: { policy: visiblePolicyWhere(user) },
    include: { policy: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json(cancellations);
}

export async function POST(request: NextRequest) {
  try {
    const data = cancellationSchema.parse(await request.json());
    if (isDirectAccessEnabled()) {
      const policy = getDemoPolicies().find((item) => item.policyNumber === data.policyNumber);
      if (!policy) return NextResponse.json({ error: "الوثيقة غير موجودة" }, { status: 404 });
      const cancellation = createDemoCancellation({
        policyId: policy.id,
        reason: data.reason as Parameters<typeof createDemoCancellation>[0]["reason"],
        notes: data.notes,
        administrativeFees: data.administrativeFees
      });
      if (cancellation === "DUPLICATE") {
        return NextResponse.json({ error: "تم إلغاء هذه الوثيقة مسبقًا" }, { status: 409 });
      }
      return NextResponse.json(cancellation, { status: 201 });
    }
    const user = await requirePermission("cancellationsWrite");
    const policy = await prisma.policy.findUniqueOrThrow({ where: { policyNumber: data.policyNumber } });
    const premium = Number(policy.premium);
    const administrativeFees = data.administrativeFees;
    const refundAmount = Math.max(premium * 0.8 - administrativeFees, 0);
    const cancellation = await prisma.$transaction(async (tx) => {
      const created = await tx.cancellation.create({
        data: {
          cancellationNumber: createSequence("CAN"),
          policyId: policy.id,
          reason: data.reason,
          notes: data.notes,
          refundAmount,
          administrativeFees
        }
      });
      await tx.policy.update({ where: { id: policy.id }, data: { status: "CANCELLED" } });
      return created;
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "CANCELLATION_CREATED",
      entity: "Cancellation",
      entityId: cancellation.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { policyNumber: policy.policyNumber }
    });
    await createSystemNotification({
      userId: user.id,
      title: "Policy cancelled",
      message: `Policy ${policy.policyNumber} was cancelled`,
      entity: "Cancellation",
      entityId: cancellation.id
    });
    return NextResponse.json(cancellation, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
