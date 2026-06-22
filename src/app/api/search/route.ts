import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { getDemoCustomers } from "@/lib/demo-customer-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return NextResponse.json([]);

  if (isDirectAccessEnabled()) {
    const text = query.toLowerCase();
    const customers = getDemoCustomers()
      .filter((item) => `${item.arabicName} ${item.englishName} ${item.passportNumber}`.toLowerCase().includes(text))
      .slice(0, 6)
      .map((item) => ({ id: item.id, title: item.arabicName, subtitle: item.passportNumber, href: `/customers/${item.id}`, type: "customer" }));
    const policies = getDemoPolicies()
      .filter((item) => `${item.policyNumber} ${item.customer.arabicName} ${item.destinationCountry.nameAr}`.toLowerCase().includes(text))
      .slice(0, 6)
      .map((item) => ({ id: item.id, title: item.policyNumber, subtitle: `${item.customer.arabicName} — ${item.destinationCountry.nameAr}`, href: `/policies/${item.id}`, type: "policy" }));
    return NextResponse.json([...customers, ...policies]);
  }

  await requireUser();
  const [customers, policies] = await Promise.all([
    prisma.customer.findMany({
      where: { OR: [
        { arabicName: { contains: query, mode: "insensitive" } },
        { englishName: { contains: query, mode: "insensitive" } },
        { passportNumber: { contains: query, mode: "insensitive" } }
      ] },
      select: { id: true, arabicName: true, passportNumber: true },
      take: 6
    }),
    prisma.policy.findMany({
      where: { OR: [
        { policyNumber: { contains: query, mode: "insensitive" } },
        { customer: { arabicName: { contains: query, mode: "insensitive" } } },
        { destinationCountry: { nameAr: { contains: query, mode: "insensitive" } } }
      ] },
      include: { customer: true, destinationCountry: true },
      take: 6
    })
  ]);

  return NextResponse.json([
    ...customers.map((item) => ({ id: item.id, title: item.arabicName, subtitle: item.passportNumber, href: `/customers/${item.id}`, type: "customer" })),
    ...policies.map((item) => ({ id: item.id, title: item.policyNumber, subtitle: `${item.customer.arabicName} — ${item.destinationCountry.nameAr}`, href: `/policies/${item.id}`, type: "policy" }))
  ]);
}
