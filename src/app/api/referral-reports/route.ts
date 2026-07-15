import { NextRequest, NextResponse } from "next/server";
import { endOfDay, endOfMonth, endOfQuarter, startOfDay, startOfMonth, startOfQuarter } from "date-fns";
import { ReferralStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";
import { addCurrencyTotal, formatCurrencyTotals, formatReferralMoney, referralStatusLabels, referralTypeLabels } from "@/lib/referrals";

export async function GET(request: NextRequest) {
  const user = await requirePermission("referralReportsRead");
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const reportType = request.nextUrl.searchParams.get("type") === "quarterly-regulatory" ? "quarterly-regulatory" : request.nextUrl.searchParams.get("type") === "monthly-cash" ? "monthly-cash" : "monthly-operational";
  const now = new Date();
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const bank = request.nextUrl.searchParams.get("bank")?.trim();
  const applicant = request.nextUrl.searchParams.get("applicant")?.trim();
  const referralNumber = request.nextUrl.searchParams.get("referralNumber")?.trim();
  const statusParam = request.nextUrl.searchParams.get("status");
  const requestedStatus = Object.values(ReferralStatus).includes(statusParam as ReferralStatus) ? statusParam as ReferralStatus : undefined;
  const status = reportType === "monthly-cash" ? ReferralStatus.ISSUED : requestedStatus;
  const from = fromParam ? startOfDay(new Date(fromParam)) : reportType === "quarterly-regulatory" ? startOfQuarter(now) : startOfMonth(now);
  const to = toParam ? endOfDay(new Date(toParam)) : reportType === "quarterly-regulatory" ? endOfQuarter(now) : endOfMonth(now);
  const dateWhere = reportType === "monthly-cash"
    ? { OR: [{ issuedAt: { gte: from, lte: to } }, { AND: [{ issuedAt: null }, { createdAt: { gte: from, lte: to } }] }] }
    : { createdAt: { gte: from, lte: to } };
  const where = {
    AND: [
      dateWhere,
      status ? { status } : {},
      referralNumber ? { referralNumber: { contains: referralNumber, mode: "insensitive" as const } } : {},
      applicant ? { applicantName: { contains: applicant, mode: "insensitive" as const } } : {},
      bank ? { OR: [
        { beneficiaryName: { contains: bank, mode: "insensitive" as const } },
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
  const premiumByCurrency: Record<string, number> = {};
  const commissionByCurrency: Record<string, number> = {};
  const bankSummaries = new Map<string, { bank: string; referralCount: number; issuedCount: number; premiumByCurrency: Record<string, number>; commissionByCurrency: Record<string, number> }>();
  referrals.forEach((item) => {
    addCurrencyTotal(premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));
    const bankName = item.beneficiaryName || item.createdByBank || item.createdByName || "Unspecified";
    const summary = bankSummaries.get(bankName) ?? { bank: bankName, referralCount: 0, issuedCount: 0, premiumByCurrency: {}, commissionByCurrency: {} };
    summary.referralCount += 1;
    if (item.status === "ISSUED") summary.issuedCount += 1;
    addCurrencyTotal(summary.premiumByCurrency, item.currency, Number(item.totalPremium));
    addCurrencyTotal(summary.commissionByCurrency, item.currency, Number(item.commission?.commissionAmount ?? 0));
    bankSummaries.set(bankName, summary);
  });
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
    { metric: "Total subscriptions", value: formatCurrencyTotals(premiumByCurrency) },
    { metric: "Total commissions", value: formatCurrencyTotals(commissionByCurrency) }
  ];

  const detailRows = referrals.map((item) => ({
    referralNumber: item.referralNumber,
    status: referralStatusLabels[item.status],
    applicantName: item.applicantName ?? "",
    beneficiaryBank: item.beneficiaryName ?? "",
    submittedBy: item.createdByBank ?? item.createdByName ?? "",
    totalPremium: formatReferralMoney(Number(item.totalPremium), item.currency),
    commissionAmount: formatReferralMoney(Number(item.commission?.commissionAmount ?? 0), item.currency),
    formCompletion: `${referralCompletion(item)}%`,
    createdAt: item.createdAt.toISOString().slice(0, 10)
  }));
  const cashDetailRows = referrals.map((item) => ({
    documentNumber: item.referralNumber,
    customerName: item.applicantName ?? "",
    productType: referralTypeLabels[item.type],
    issueDate: (item.issuedAt ?? item.createdAt).toISOString().slice(0, 10),
    paidSubscription: formatReferralMoney(Number(item.totalPremium), item.currency),
    dueCommission: formatReferralMoney(Number(item.commission?.commissionAmount ?? 0), item.currency),
    policyStatus: referralStatusLabels[item.status]
  }));
  const bankSummaryRows = Array.from(bankSummaries.values()).map((item) => ({
    bank: item.bank,
    referralCount: item.referralCount,
    issuedCount: item.issuedCount,
    totalPremium: formatCurrencyTotals(item.premiumByCurrency),
    totalCommission: formatCurrencyTotals(item.commissionByCurrency)
  }));

  const rows = reportType === "monthly-cash"
    ? [...summaryRows, ...cashDetailRows.map((item) => ({ metric: item.documentNumber, value: `${item.customerName} | ${item.productType} | ${item.issueDate} | ${item.paidSubscription} | ${item.dueCommission} | ${item.policyStatus}` }))]
    : [...summaryRows, ...detailRows.map((item) => ({ metric: item.referralNumber, value: `${item.status} | ${item.totalPremium} | ${item.commissionAmount} | ${item.formCompletion}` }))];
  const title = reportType === "quarterly-regulatory" ? "Quarterly regulatory referral report" : reportType === "monthly-cash" ? "Monthly issued referrals cash report" : "Monthly operational referral report";
  const excelRows: Record<string, unknown>[] = reportType === "quarterly-regulatory"
    ? [...summaryRows, ...bankSummaryRows]
    : reportType === "monthly-cash"
      ? [...summaryRows, ...cashDetailRows]
      : [...summaryRows, ...bankSummaryRows, ...detailRows];

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(excelRows, "Referral Report");
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
    bankSummaryRows,
    detailRows: reportType === "monthly-cash" ? cashDetailRows : detailRows
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
