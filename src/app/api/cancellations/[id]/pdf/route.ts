import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { createCertificatePdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/utils";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoCancellations } from "@/lib/demo-cancellation-store";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDirectAccessEnabled()) {
    const cancellation = getDemoCancellations().find((item) => item.id === id);
    if (!cancellation) return new Response("Cancellation not found", { status: 404 });
    const doc = await createCertificatePdf({
      title: "Policy Cancellation Certificate",
      number: cancellation.cancellationNumber,
      lines: [
        `Policy: ${cancellation.policy.policyNumber}`,
        `Customer: ${cancellation.policy.customer.englishName}`,
        `Reason: ${cancellation.reason}`,
        `Refund: ${formatCurrency(cancellation.refundAmount)}`,
        `Administrative Fees: ${formatCurrency(cancellation.administrativeFees)}`
      ]
    });
    return new Response(Buffer.from(doc.output("arraybuffer")), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${cancellation.cancellationNumber}.pdf"` }
    });
  }
  await requireUser();
  const cancellation = await prisma.cancellation.findUniqueOrThrow({
    where: { id },
    include: { policy: { include: { customer: true } } }
  });
  const doc = await createCertificatePdf({
    title: "Policy Cancellation Certificate",
    number: cancellation.cancellationNumber,
    lines: [
      `Policy: ${cancellation.policy.policyNumber}`,
      `Customer: ${cancellation.policy.customer.englishName}`,
      `Reason: ${cancellation.reason}`,
      `Refund: ${formatCurrency(String(cancellation.refundAmount))}`,
      `Administrative Fees: ${formatCurrency(String(cancellation.administrativeFees))}`
    ]
  });
  return new Response(Buffer.from(doc.output("arraybuffer")), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${cancellation.cancellationNumber}.pdf"` }
  });
}
