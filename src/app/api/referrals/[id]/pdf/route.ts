import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api";
import { rowsToPdfBuffer } from "@/lib/exports";
import { referralStatusLabels, referralTypeLabels, transportModeLabels } from "@/lib/referrals";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== Role.SUPER_ADMIN) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const referral = await prisma.referral.findUnique({
    where: { id },
    include: { installments: true, commission: true }
  });
  if (!referral) return new Response("Not found", { status: 404 });

  const rows = [
    { field: "Referral Number", value: referral.referralNumber },
    { field: "Type", value: referralTypeLabels[referral.type] },
    { field: "Status", value: referralStatusLabels[referral.status] },
    { field: "Applicant", value: referral.applicantName ?? "" },
    { field: "Beneficiary", value: referral.beneficiaryName ?? "" },
    { field: "Insured Amount", value: referral.insuredAmount ? String(referral.insuredAmount) : "" },
    { field: "Insurance From", value: referral.insuranceFrom?.toISOString().slice(0, 10) ?? "" },
    { field: "Insurance To", value: referral.insuranceTo?.toISOString().slice(0, 10) ?? "" },
    { field: "Total After Increase", value: referral.totalInsuredAfterIncrease ? String(referral.totalInsuredAfterIncrease) : "" },
    { field: "Increase Rate", value: referral.increaseRate ? `${referral.increaseRate}%` : "" },
    { field: "Cover Type", value: referral.coverType ?? "" },
    { field: "Cargo", value: referral.cargoDescription ?? "" },
    { field: "Route", value: `${referral.routeFrom ?? ""} - ${referral.routeTo ?? ""}` },
    { field: "Transport", value: referral.transportMode ? transportModeLabels[referral.transportMode] : "" },
    { field: "Packaging", value: referral.packagingType ?? "" },
    { field: "LC NO", value: referral.lcNumber ?? "" },
    { field: "Carrier", value: referral.carrierName ?? "" },
    { field: "Invoice", value: referral.invoiceNumber ?? "" },
    { field: "Currency", value: referral.currency },
    { field: "Extra Risks", value: referral.extraRisks.join(", ") },
    { field: "Previous Compensation", value: referral.hasPreviousCompensation ? "Yes" : "No" },
    { field: "Total Premium", value: String(referral.totalPremium) },
    { field: "Notes", value: referral.notes ?? "" },
    ...referral.installments.map((item, index) => ({
      field: `Installment ${index + 1}`,
      value: `${item.label ?? ""} ${item.amount ?? ""} ${item.dueDate?.toISOString().slice(0, 10) ?? ""}`
    })),
    ...(referral.commission ? [{ field: "Commission", value: `${referral.commission.commissionAmount} ${referral.commission.currency}` }] : [])
  ];

  const buffer = await rowsToPdfBuffer(`Referral ${referral.referralNumber}`, rows);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="referral-${referral.referralNumber}.pdf"`
    }
  });
}
