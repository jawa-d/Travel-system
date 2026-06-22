import { NextRequest, NextResponse } from "next/server";
import { endOfDay, endOfMonth, endOfYear, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api";
import { rowsToExcelBuffer, rowsToPdfBuffer } from "@/lib/exports";

export async function GET(request: NextRequest) {
  await requirePermission("reportsRead");
  const period = request.nextUrl.searchParams.get("period") ?? "monthly";
  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const now = new Date();
  const from = period === "daily" ? startOfDay(now) : period === "yearly" ? startOfYear(now) : startOfMonth(now);
  const to = period === "daily" ? endOfDay(now) : period === "yearly" ? endOfYear(now) : endOfMonth(now);

  const [totalPolicies, premiums, topDestinations, topCustomers, nationalities, claims] = await Promise.all([
    prisma.policy.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.policy.aggregate({ _sum: { premium: true }, where: { createdAt: { gte: from, lte: to } } }),
    prisma.policy.groupBy({ by: ["destinationCountryId"], _count: true, orderBy: { _count: { destinationCountryId: "desc" } }, take: 10 }),
    prisma.policy.groupBy({ by: ["customerId"], _count: true, orderBy: { _count: { customerId: "desc" } }, take: 10 }),
    prisma.customer.groupBy({ by: ["nationality"], _count: true, orderBy: { _count: { nationality: "desc" } }, take: 10 }),
    prisma.claim.groupBy({ by: ["status"], _count: true })
  ]);

  const rows = [
    { metric: "Total Policies", value: totalPolicies },
    { metric: "Total Premiums", value: String(premiums._sum.premium ?? 0) },
    { metric: "Top Destination Records", value: topDestinations.length },
    { metric: "Top Customer Records", value: topCustomers.length },
    { metric: "Nationality Records", value: nationalities.length },
    { metric: "Claim Status Records", value: claims.length }
  ];

  if (format === "xlsx") {
    const buffer = rowsToExcelBuffer(rows, "Analytics");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="report-${period}.xlsx"`
      }
    });
  }

  if (format === "pdf") {
    const buffer = rowsToPdfBuffer(`TRINSU ${period} report`, rows);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="report-${period}.pdf"` }
    });
  }

  return NextResponse.json({
    period,
    from,
    to,
    totalPolicies,
    totalPremiums: premiums._sum.premium ?? 0,
    topDestinations,
    topCustomers,
    nationalityStatistics: nationalities,
    claimStatistics: claims
  });
}
