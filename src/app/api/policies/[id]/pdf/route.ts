import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createPolicyPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/utils";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { canAccessPolicy } from "@/lib/policy-access";
import { getPolicyVerificationUrl } from "@/lib/policy-verification";

function formatPdfDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(value));
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const policy = getDemoPolicies().find((item) => item.id === id);
    if (!policy) return new Response("Policy not found", { status: 404 });
    const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
    const doc = await createPolicyPdf({
      policyNumber: policy.policyNumber,
      customerName: policy.customer.englishName,
      passportNumber: policy.customer.passportNumber,
      nationality: policy.customer.nationality,
      destination: policy.destinationCountry.nameEn,
      coverageAmount: String(policy.coverageAmount),
      agency: "Demo Agency",
      policyType: policy.policyType,
      planName: policy.travelPlan.name,
      departureDate: formatPdfDate(policy.departureDate),
      returnDate: formatPdfDate(policy.returnDate),
      premium: formatCurrency(policy.premium),
      verificationUrl,
      issueDate: formatPdfDate(policy.createdAt),
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
    include: { customer: true, destinationCountry: true, travelPlan: true, issuedBy: true, agency: true }
  });
  if (policy.deletedAt || !canAccessPolicy(user, policy)) {
    return new Response("Forbidden", { status: 403 });
  }
  const verificationUrl = getPolicyVerificationUrl(policy.policyNumber);
  const doc = await createPolicyPdf({
    policyNumber: policy.policyNumber,
    customerName: policy.customer.englishName,
    passportNumber: policy.customer.passportNumber,
    nationality: policy.customer.nationality,
    destination: policy.destinationCountry.nameEn,
    coverageAmount: String(policy.coverageAmount),
    agency: policy.agency?.name ?? policy.issuedByAgency ?? "-",
    policyType: policy.policyType,
    planName: policy.travelPlan.name,
    departureDate: formatPdfDate(policy.departureDate),
    returnDate: formatPdfDate(policy.returnDate),
    premium: formatCurrency(String(policy.premium)),
    verificationUrl,
    issueDate: formatPdfDate(policy.issuedAt ?? policy.createdAt),
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
