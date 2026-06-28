import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requirePermission, requireUser } from "@/lib/api";
import { createPolicyNumber } from "@/lib/policy-number";
import { calculatePremium } from "@/lib/pricing";
import { policySchema } from "@/lib/validators";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createSystemNotification, schedulePolicyExpiryNotifications } from "@/lib/notifications";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoCustomers } from "@/lib/demo-customer-store";
import { getDemoCountries } from "@/lib/demo-country-store";
import { getDemoPlans } from "@/lib/demo-plan-store";
import { createDemoPolicy } from "@/lib/demo-policy-store";
import { getAge } from "@/lib/utils";
import { auth } from "@/auth";
import { getActorSnapshot, visibleCustomerWhere, visiblePolicyWhere } from "@/lib/policy-access";
import { createPolicyVerificationQr } from "@/lib/policy-verification";

export async function GET() {
  const user = await requireUser();
  const policies = await prisma.policy.findMany({
    where: visiblePolicyWhere(user),
    include: { customer: true, destinationCountry: true, travelPlan: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json(policies);
}

export async function POST(request: NextRequest) {
  try {
    const payload = policySchema.parse(await request.json());
    const policyNumber = createPolicyNumber();
    const session = await auth();
    if (isDirectAccessEnabled() && !session?.user) {
      const sourceCustomer = payload.customerId
        ? getDemoCustomers().find((customer) => customer.id === payload.customerId)
        : null;
      const customerData = sourceCustomer ?? payload.customer;
      const country = getDemoCountries().find((item) => item.id === payload.destinationCountryId);
      const plan = getDemoPlans().find((item) => item.id === payload.travelPlanId);
      if (!customerData || !country || !plan) {
        return NextResponse.json({ error: "بيانات العميل أو الدولة أو الخطة غير مكتملة" }, { status: 400 });
      }
      const age = getAge(customerData.dateOfBirth);
      const ageMultiplier = age < 18 ? 0.85 : age > 65 ? 1.85 : age > 50 ? 1.35 : 1;
      const durationMultiplier = payload.numberOfDays <= 7 ? 1 : payload.numberOfDays <= 30 ? 1.25 : 1.65;
      const countryMultiplier = country.category === "HIGH_RISK" ? 1.75 : country.category === "RESTRICTED" ? 1.35 : 1;
      const premium = Number((
        plan.price * ageMultiplier * durationMultiplier *
        Math.sqrt(payload.coverageAmount / 10000) * countryMultiplier
      ).toFixed(2));
      const qrCodeData = await createPolicyVerificationQr(policyNumber);
      const policy = createDemoPolicy({
        id: `demo-policy-${crypto.randomUUID()}`,
        policyNumber,
        customer: {
          id: sourceCustomer?.id ?? `demo-customer-${crypto.randomUUID()}`,
          arabicName: customerData.arabicName,
          englishName: customerData.englishName,
          passportNumber: customerData.passportNumber,
          dateOfBirth: new Date(customerData.dateOfBirth),
          mobile: customerData.mobile,
          email: customerData.email || null
        },
        destinationCountry: { id: country.id, nameAr: country.nameAr },
        travelPlan: { id: plan.id, name: plan.name },
        departureDate: payload.departureDate,
        returnDate: payload.returnDate,
        premium,
        coverageAmount: payload.coverageAmount,
        policyType: payload.policyType,
        status: payload.status,
        qrCodeData,
        createdAt: new Date()
      });
      return NextResponse.json(policy, { status: 201 });
    }
    const user = await requirePermission("policiesWrite");
    const actor = await getActorSnapshot(user);

    const customerId = payload.customerId
      ? (
          await prisma.customer.findFirst({
            where: { AND: [{ id: payload.customerId }, visibleCustomerWhere(user)] },
            select: { id: true }
          })
        )?.id
      : (
          await prisma.customer.create({
            data: {
              ...payload.customer!,
              createdByUserId: actor.userId,
              createdByName: actor.name,
              createdByEmail: actor.email,
              createdByRole: actor.role,
              createdByAgency: actor.agencyName
            }
          })
        ).id;

    if (!customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const premium = await calculatePremium({
      dateOfBirth: customer.dateOfBirth,
      numberOfDays: payload.numberOfDays,
      destinationCountryId: payload.destinationCountryId,
      coverageAmount: payload.coverageAmount,
      travelPlanId: payload.travelPlanId
    });
    const qrCodeData = await createPolicyVerificationQr(policyNumber);

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
        policyNumber,
        customerId,
        destinationCountryId: payload.destinationCountryId,
        destinations: payload.destinations,
        travelPurpose: payload.travelPurpose,
        departureDate: payload.departureDate,
        returnDate: payload.returnDate,
        numberOfDays: payload.numberOfDays,
        coverageAmount: payload.coverageAmount,
        policyType: payload.policyType,
        coverageType: payload.coverageType,
        travelPlanId: payload.travelPlanId,
        premium: premium.premium,
        status: payload.status,
        qrCodeData,
        issuedById: user.id,
        issuedByUserId: actor.userId,
        issuedByName: actor.name,
        issuedByEmail: actor.email,
        issuedByRole: actor.role,
        issuedByAgency: actor.agencyName,
        agencyId: actor.agencyId,
        issuedAt: payload.status === "ACTIVE" ? new Date() : null
      },
      include: { customer: true, destinationCountry: true, travelPlan: true }
      });
      await tx.activity.create({
        data: { actorId: user.id, action: "ISSUE", entity: "Policy", entityId: created.id, metadata: { policyNumber } }
      });
      return created;
    });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      agency: actor.agencyName,
      action: "POLICY_CREATED",
      entity: "Policy",
      entityId: policy.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { policyNumber }
    });
    await createSystemNotification({
      userId: user.id,
      title: "وثيقة جديدة",
      message: `تم إصدار الوثيقة ${policy.policyNumber}`,
      entity: "Policy",
      entityId: policy.id
    });
    if (policy.status === "ACTIVE") await schedulePolicyExpiryNotifications(policy.id);

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
