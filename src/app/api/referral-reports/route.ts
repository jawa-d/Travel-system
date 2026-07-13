import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";
import { referralStatusLabels } from "@/lib/referrals";

export async function GET(request: NextRequest) {
  const user = await requirePermission("referralReportsRead");
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const from = fromParam ? startOfDay(new Date(fromParam)) : undefined;
  const to = toParam ? endOfDay(new Date(toParam)) : undefined;

  const referrals = await prisma.referral.findMany({
    where: from || to ? { createdAt: { gte: from, lte: to } } : undefined,
    include: { commission: true, installments: true },
    orderBy: { createdAt: "desc" }
  });

  const rows = referrals.map((item) => ({
    referralNumber: item.referralNumber,
    status: referralStatusLabels[item.status],
    applicantName: item.applicantName,
    beneficiaryName: item.beneficiaryName,
    bank: item.createdByBank ?? item.createdByName ?? "",
    totalPremium: Number(item.totalPremium),
    installments: item.installments.length,
    commissionAmount: Number(item.commission?.commissionAmount ?? 0),
    currency: item.currency,
    createdAt: item.createdAt.toISOString().slice(0, 10)
  }));

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(rows, "Referral Report");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"referral-report.xlsx\""
      }
    });
  }

  if (format === "pdf") {
    const buffer = await rowsToPdfBuffer("Referral commissions report", rows);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"referral-report.pdf\"" }
    });
  }

  return NextResponse.json({
    user: { id: user.id, role: user.role },
    totalReferrals: referrals.length,
    totalPremium: referrals.reduce((sum, item) => sum + Number(item.totalPremium), 0),
    totalCommissions: referrals.reduce((sum, item) => sum + Number(item.commission?.commissionAmount ?? 0), 0),
    rows
  });
}
