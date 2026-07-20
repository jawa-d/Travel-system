import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { createMotorRequestPdf } from "@/lib/pdf";

type PdfAsset = { url?: string; name?: string; label?: string; category?: string; type?: string };
type ApprovalAsset = { url?: string; name?: string; uploadedByName?: string };

function asset(value: unknown): ApprovalAsset | null {
  return value && typeof value === "object" ? value as ApprovalAsset : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("motorRequestsRead");
  const { id } = await params;
  const motorRequest = await prisma.motorInsuranceRequest.findUnique({ where: { id } });
  if (!motorRequest) return new Response("Motor request not found", { status: 404 });
  if (user.role === Role.AGENT && motorRequest.agentId !== user.id) return new Response("Not found", { status: 404 });
  if (motorRequest.requestType !== "MOTOR") return new Response("PDF generation is available for motor requests only.", { status: 400 });

  const origin = request.nextUrl.origin;
  const verificationUrl = `${origin}/api/v1/public/motor-requests/${encodeURIComponent(motorRequest.requestNumber)}`;
  const doc = await createMotorRequestPdf({
    requestNumber: motorRequest.requestNumber,
    issueDate: motorRequest.createdDate.toISOString().slice(0, 10),
    customerFullName: motorRequest.customerFullName,
    customerMobile: motorRequest.customerMobile,
    customerEmail: motorRequest.customerEmail,
    customerNationalId: motorRequest.customerNationalId ?? "",
    customerAddress: motorRequest.customerAddress ?? "",
    customerCity: motorRequest.customerCity ?? "",
    vehicleType: motorRequest.vehicleType ?? "",
    manufacturer: motorRequest.manufacturer ?? "",
    model: motorRequest.model ?? "",
    manufacturingYear: motorRequest.manufacturingYear ?? new Date().getFullYear(),
    color: motorRequest.color ?? "",
    plateNumber: motorRequest.plateNumber ?? "",
    chassisNumber: motorRequest.chassisNumber ?? "",
    engineNumber: motorRequest.engineNumber ?? "",
    estimatedVehicleValue: motorRequest.estimatedVehicleValue ? String(motorRequest.estimatedVehicleValue) : "0",
    coverageType: motorRequest.coverageType,
    coverageNotes: motorRequest.coverageNotes,
    insurancePremium: String(motorRequest.insurancePremium),
    discount: String(motorRequest.discount),
    additionalFees: String(motorRequest.additionalFees),
    taxes: String(motorRequest.taxes),
    netPremium: String(motorRequest.netPremium),
    pricingCurrency: motorRequest.pricingCurrency,
    pricingNotes: motorRequest.pricingNotes,
    policyTermsHtml: motorRequest.policyTermsHtml,
    vehicleImages: (motorRequest.vehicleImages as PdfAsset[]).map((item) => ({ ...item, label: item.category ?? item.label })),
    customerDocuments: motorRequest.customerDocuments as PdfAsset[],
    verificationUrl,
    preparedByName: motorRequest.reviewedByName ?? motorRequest.agentName,
    reviewedByName: motorRequest.reviewedByName,
    approvedByName: motorRequest.approvedByName,
    underwriterSignature: asset(motorRequest.underwriterSignature),
    managerSignature: asset(motorRequest.managerSignature),
    companyStamp: asset(motorRequest.companyStamp)
  });

  return new Response(Buffer.from(doc.output("arraybuffer")), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${motorRequest.requestNumber}.pdf"`
    }
  });
}
