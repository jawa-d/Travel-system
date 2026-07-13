import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";
import { addCurrencyTotal, formatCurrencyTotals, formatReferralMoney } from "@/lib/referrals";

export async function GET(request: NextRequest) {
  await requirePermission("referralCommissionsRead");
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const bank = request.nextUrl.searchParams.get("bank")?.trim();
  const referralNumber = request.nextUrl.searchParams.get("referralNumber")?.trim();
  const from = fromParam ? startOfDay(new Date(fromParam)) : undefined;
  const to = toParam ? endOfDay(new Date(toParam)) : undefined;

  const commissions = await prisma.referralCommission.findMany({
    where: {
      referral: {
        ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
        ...(referralNumber ? { referralNumber: { contains: referralNumber, mode: "insensitive" } } : {}),
        ...(bank ? { OR: [
          { createdByBank: { contains: bank, mode: "insensitive" } },
          { createdByName: { contains: bank, mode: "insensitive" } },
          { createdByEmail: { contains: bank, mode: "insensitive" } }
        ] } : {})
      }
    },
    include: { referral: true },
    orderBy: { paidAt: "desc" }
  });

  const commissionByCurrency: Record<string, number> = {};
  const rows = commissions.map((item) => {
    addCurrencyTotal(commissionByCurrency, item.currency, Number(item.commissionAmount));
    return {
    referralNumber: item.referral.referralNumber,
    bank: item.paidToBank || item.referral.createdByBank || item.paidToName || item.referral.createdByName || "",
    applicantName: item.referral.applicantName ?? "",
    premiumAmount: formatReferralMoney(Number(item.premiumAmount), item.currency),
    commissionRate: `${item.commissionRate}%`,
    commissionAmount: formatReferralMoney(Number(item.commissionAmount), item.currency),
    currency: item.currency,
    paidAt: item.paidAt.toISOString().slice(0, 10)
    };
  });

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(rows, "Referral Commissions");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"referral-commissions.xlsx\""
      }
    });
  }

  if (format === "pdf") {
    const buffer = await rowsToPdfBuffer("Referral commissions statement", rows);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"referral-commissions.pdf\"" }
    });
  }

  return NextResponse.json({
    totalCommissions: commissions.length,
    totalAmount: formatCurrencyTotals(commissionByCurrency),
    totalByCurrency: commissionByCurrency,
    rows
  });
}
