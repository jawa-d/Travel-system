import { NextRequest, NextResponse } from "next/server";
import { endOfDay, endOfMonth, endOfQuarter, startOfDay, startOfMonth, startOfQuarter } from "date-fns";
import { ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";
import { referralStatusLabels } from "@/lib/referrals";

export async function GET(request: NextRequest) {
  const user = await requirePermission("referralReportsRead");
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const reportType = request.nextUrl.searchParams.get("type") === "quarterly-regulatory" ? "quarterly-regulatory" : "monthly-operational";
  const now = new Date();
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const bank = request.nextUrl.searchParams.get("bank")?.trim();
  const applicant = request.nextUrl.searchParams.get("applicant")?.trim();
  const referralNumber = request.nextUrl.searchParams.get("referralNumber")?.trim();
  const statusParam = request.nextUrl.searchParams.get("status");
  const status = Object.values(ReferralStatus).includes(statusParam as ReferralStatus) ? statusParam as ReferralStatus : undefined;
  const from = fromParam ? startOfDay(new Date(fromParam)) : reportType === "quarterly-regulatory" ? startOfQuarter(now) : startOfMonth(now);
  const to = toParam ? endOfDay(new Date(toParam)) : reportType === "quarterly-regulatory" ? endOfQuarter(now) : endOfMonth(now);
  const where = {
    AND: [
      { createdAt: { gte: from, lte: to } },
      status ? { status } : {},
      referralNumber ? { referralNumber: { contains: referralNumber, mode: "insensitive" as const } } : {},
      applicant ? { applicantName: { contains: applicant, mode: "insensitive" as const } } : {},
      bank ? { OR: [
        { createdByBank: { contains: bank, mode: "insensitive" as const } },
        { createdByName: { contains: bank, mode: "insensitive" as const } },
        { createdByEmail: { contains: bank, mode: "insensitive" as const } }
      ] } : {}
    ]
  };

  const referrals = await prisma.referral.findMany({
    where,
    include: { commission: true, installments: true },
    orderBy: { createdAt: "desc" }
  });

  const issuedCount = referrals.filter((item) => item.status === "ISSUED").length;
  const totalPremium = referrals.reduce((sum, item) => sum + Number(item.totalPremium), 0);
  const totalCommission = referrals.reduce((sum, item) => sum + Number(item.commission?.commissionAmount ?? 0), 0);
  const conversionRate = referrals.length ? issuedCount / referrals.length * 100 : 0;
  const complianceScore = referrals.length ? Math.round(referrals.reduce((sum, item) => sum + referralCompletion(item), 0) / referrals.length) : 100;
  const incompleteForms = referrals.filter((item) => referralCompletion(item) < 80).length;
  const riskLevel = complianceScore >= 90 ? "Low" : complianceScore >= 70 ? "Medium" : "High";

  const summaryRows = reportType === "quarterly-regulatory" ? [
    { metric: "Referral form compliance review", value: `${complianceScore}%` },
    { metric: "Incomplete referral forms", value: incompleteForms },
    { metric: "Complaint cases", value: 0 },
    { metric: "Regulatory violations", value: 0 },
    { metric: "Compliance risk assessment", value: riskLevel }
  ] : [
    { metric: "Referral count", value: referrals.length },
    { metric: "Issued policy count", value: issuedCount },
    { metric: "Conversion rate", value: `${conversionRate.toFixed(1)}%` },
    { metric: "Total subscriptions", value: totalPremium },
    { metric: "Total commissions", value: totalCommission }
  ];

  const detailRows = referrals.map((item) => ({
    referralNumber: item.referralNumber,
    status: referralStatusLabels[item.status],
    applicantName: item.applicantName ?? "",
    bank: item.createdByBank ?? item.createdByName ?? "",
    totalPremium: Number(item.totalPremium),
    commissionAmount: Number(item.commission?.commissionAmount ?? 0),
    formCompletion: `${referralCompletion(item)}%`,
    createdAt: item.createdAt.toISOString().slice(0, 10)
  }));

  const rows = [...summaryRows, ...detailRows.map((item) => ({ metric: item.referralNumber, value: `${item.status} | ${item.totalPremium} | ${item.commissionAmount} | ${item.formCompletion}` }))];
  const title = reportType === "quarterly-regulatory" ? "Quarterly regulatory referral report" : "Monthly operational referral report";

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(reportType === "quarterly-regulatory" ? summaryRows : [...summaryRows, ...detailRows], "Referral Report");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${reportType}.xlsx"`
      }
    });
  }

  if (format === "pdf") {
    const buffer = await rowsToPdfBuffer(title, rows);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${reportType}.pdf"` }
    });
  }

  return NextResponse.json({
    user: { id: user.id, role: user.role },
    reportType,
    from,
    to,
    summaryRows,
    detailRows
  });
}

function referralCompletion(referral: {
  applicantName: string | null;
  beneficiaryName: string | null;
  insuredAmount: unknown;
  insuranceFrom: Date | null;
  insuranceTo: Date | null;
  totalInsuredAfterIncrease: unknown;
  coverType: string | null;
  cargoDescription: string | null;
  routeFrom: string | null;
  routeTo: string | null;
  transportMode: unknown;
  packagingType: string | null;
  invoiceNumber: string | null;
}) {
  const fields = [
    referral.applicantName,
    referral.beneficiaryName,
    referral.insuredAmount,
    referral.insuranceFrom,
    referral.insuranceTo,
    referral.totalInsuredAfterIncrease,
    referral.coverType,
    referral.cargoDescription,
    referral.routeFrom,
    referral.routeTo,
    referral.transportMode,
    referral.packagingType,
    referral.invoiceNumber
  ];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}
