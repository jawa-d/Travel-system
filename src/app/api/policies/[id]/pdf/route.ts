import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createPolicyPdf } from "@/lib/pdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { canAccessPolicy } from "@/lib/policy-access";
import { getPolicyVerificationUrl } from "@/lib/policy-verification";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const policy = getDemoPolicies().find((item) => item.id === id);
    if (!policy) return new Response("Policy not found", { status: 404 });
    const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
    const doc = await createPolicyPdf({
      policyNumber: policy.policyNumber,
      customerName: policy.customer.englishName,
      arabicCustomerName: policy.customer.arabicName,
      passportNumber: policy.customer.passportNumber,
      destination: policy.destinationCountry.nameAr,
      coverageAmount: String(policy.coverageAmount),
      policyType: policy.policyType,
      planName: policy.travelPlan.name,
      departureDate: formatDate(policy.departureDate),
      returnDate: formatDate(policy.returnDate),
      premium: formatCurrency(policy.premium),
      verificationUrl,
      issueDate: formatDate(policy.createdAt),
      issuedBy: "Iraq Takaful Demo",
      issuedByRole: "SUPER_ADMIN"
    });
    return new Response(Buffer.from(doc.output("arraybuffer")), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${policy.policyNumber}.pdf"`
      }
    });
  }
  const user = await requireUser();
  const policy = await prisma.policy.findUniqueOrThrow({
    where: { id },
    include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true }
  });
  if (policy.deletedAt || !canAccessPolicy(user, policy)) {
    return new Response("Forbidden", { status: 403 });
  }
  const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
  const doc = await createPolicyPdf({
    policyNumber: policy.policyNumber,
    customerName: policy.customer.englishName,
    arabicCustomerName: policy.customer.arabicName,
    passportNumber: policy.customer.passportNumber,
    destination: policy.destinationCountry.nameEn,
    coverageAmount: String(policy.coverageAmount),
    policyType: policy.policyType,
    planName: policy.travelPlan.name,
    departureDate: formatDate(policy.departureDate),
    returnDate: formatDate(policy.returnDate),
    premium: formatCurrency(String(policy.premium)),
    verificationUrl,
    issueDate: formatDate(policy.issuedAt ?? policy.createdAt),
    issuedBy: policy.issuedByName ?? policy.issuedBy?.name ?? "-",
    issuedByRole: policy.issuedByRole ?? policy.issuedBy?.role ?? "-"
  });
  const buffer = Buffer.from(doc.output("arraybuffer"));
  await writeAuditLog({
    userId: user.id,
    role: user.role,
    action: "POLICY_PRINTED",
    entity: "Policy",
    entityId: policy.id,
    ipAddress: getIpAddress(_.headers),
    metadata: { policyNumber: policy.policyNumber }
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${policy.policyNumber}.pdf"`
    }
  });
}
