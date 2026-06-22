import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  const allowed = rateLimit(`verify:${key}`, 30, 60_000);
  if (!allowed.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const policyNumber = request.nextUrl.searchParams.get("policyNumber") ?? "";
  const policy = await prisma.policy.findFirst({
    where: { policyNumber, deletedAt: null },
    include: { customer: true, destinationCountry: true, travelPlan: true }
  });
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  return NextResponse.json({
    policyNumber: policy.policyNumber,
    status: policy.status,
    customerName: policy.customer.arabicName,
    coverageDates: { from: policy.departureDate, to: policy.returnDate },
    details: {
      passportNumber: policy.customer.passportNumber,
      destination: policy.destinationCountry.nameAr,
      coverageAmount: policy.coverageAmount,
      premium: policy.premium,
      plan: policy.travelPlan.name
    }
  });
}
