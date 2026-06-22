import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { createCertificatePdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/utils";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoEndorsements } from "@/lib/demo-endorsement-store";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const endorsement = getDemoEndorsements().find((item) => item.id === id);
    if (!endorsement) return new Response("Endorsement not found", { status: 404 });
    const doc = await createCertificatePdf({
      title: "Policy Endorsement Certificate",
      number: endorsement.endorsementNumber,
      lines: [
        `Policy: ${endorsement.policy.policyNumber}`,
        `Customer: ${endorsement.policy.customer.englishName}`,
        `Type: ${endorsement.endorsementType}`,
        `Additional Premium: ${formatCurrency(endorsement.additionalPremium)}`,
        `Status: ${endorsement.status}`
      ]
    });
    return new Response(Buffer.from(doc.output("arraybuffer")), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${endorsement.endorsementNumber}.pdf"` }
    });
  }
  await requireUser();
  const endorsement = await prisma.endorsement.findUniqueOrThrow({
    where: { id },
    include: { policy: { include: { customer: true } } }
  });
  const doc = await createCertificatePdf({
    title: "Policy Endorsement Certificate",
    number: endorsement.endorsementNumber,
    lines: [
      `Policy: ${endorsement.policy.policyNumber}`,
      `Customer: ${endorsement.policy.customer.englishName}`,
      `Type: ${endorsement.endorsementType}`,
      `Additional Premium: ${formatCurrency(String(endorsement.additionalPremium))}`,
      `Status: ${endorsement.status}`
    ]
  });
  return new Response(Buffer.from(doc.output("arraybuffer")), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${endorsement.endorsementNumber}.pdf"` }
  });
}
