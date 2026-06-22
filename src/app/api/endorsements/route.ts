import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { endorsementSchema } from "@/lib/validators";
import { createSequence } from "@/lib/numbers";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { createDemoEndorsement, getDemoEndorsements } from "@/lib/demo-endorsement-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { visiblePolicyWhere } from "@/lib/policy-access";

export async function GET() {
  if (isDirectAccessEnabled()) return NextResponse.json(getDemoEndorsements());
  const user = await requireUser();
  const endorsements = await prisma.endorsement.findMany({
    where: { policy: visiblePolicyWhere(user) },
    include: { policy: { include: { customer: true } }, destinationCountry: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return NextResponse.json(endorsements);
}

export async function POST(request: NextRequest) {
  try {
    const data = endorsementSchema.parse(await request.json());
    if (isDirectAccessEnabled()) {
      const policy = getDemoPolicies().find((item) => item.policyNumber === data.policyNumber);
      if (!policy) return NextResponse.json({ error: "الوثيقة غير موجودة" }, { status: 404 });
      return NextResponse.json(createDemoEndorsement({
        policy: { id: policy.id, policyNumber: policy.policyNumber, customer: { arabicName: policy.customer.arabicName, englishName: policy.customer.englishName } },
        endorsementType: data.endorsementType as Parameters<typeof createDemoEndorsement>[0]["endorsementType"],
        newValue: data.newValue,
        additionalPremium: data.additionalPremium,
        status: data.status
      }), { status: 201 });
    }
    const user = await requirePermission("endorsementsWrite");
    const policy = await prisma.policy.findUniqueOrThrow({ where: { policyNumber: data.policyNumber } });
    const endorsement = await prisma.endorsement.create({
      data: {
        endorsementNumber: createSequence("END"),
        policyId: policy.id,
        endorsementType: data.endorsementType,
        previousValue: {
          returnDate: policy.returnDate,
          destinationCountryId: policy.destinationCountryId,
          coverageAmount: policy.coverageAmount
        },
        newValue: data.newValue as Prisma.InputJsonValue,
        destinationCountryId: data.destinationCountryId || null,
        additionalPremium: data.additionalPremium,
        status: data.status,
        createdById: user.id,
        createdByName: user.name ?? user.email ?? "System"
      }
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENDORSEMENT_CREATED",
      entity: "Endorsement",
      entityId: endorsement.id,
      ipAddress: getIpAddress(request.headers)
    });
    return NextResponse.json(endorsement, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
