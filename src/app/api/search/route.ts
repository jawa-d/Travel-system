import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return NextResponse.json([]);

  const user = await requireUser();
  const motorRequestWhere = user.role === Role.AGENT ? { agentId: user.id } : {};
  const referralWhere = user.role === Role.BANK ? { createdById: user.id } : {};
  const reportRequestWhere = user.role === Role.BANK ? { requesterId: user.id } : {};

  const [motorRequests, referrals, reportRequests] = await Promise.all([
    prisma.motorInsuranceRequest.findMany({
      where: {
        AND: [
          motorRequestWhere,
          { OR: [
            { requestNumber: { contains: query, mode: "insensitive" } },
            { customerFullName: { contains: query, mode: "insensitive" } },
            { customerNationalId: { contains: query, mode: "insensitive" } },
            { plateNumber: { contains: query, mode: "insensitive" } },
            { chassisNumber: { contains: query, mode: "insensitive" } }
          ] }
        ]
      },
      select: { id: true, requestNumber: true, customerFullName: true, plateNumber: true, status: true },
      take: 6
    }),
    prisma.referral.findMany({
      where: {
        AND: [
          referralWhere,
          { OR: [
            { referralNumber: { contains: query, mode: "insensitive" } },
            { applicantName: { contains: query, mode: "insensitive" } },
            { beneficiaryName: { contains: query, mode: "insensitive" } }
          ] }
        ]
      },
      select: { id: true, referralNumber: true, applicantName: true, status: true },
      take: 6
    }),
    prisma.reportRequest.findMany({
      where: {
        AND: [
          reportRequestWhere,
          { OR: [
            { requestNumber: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { requesterName: { contains: query, mode: "insensitive" } }
          ] }
        ]
      },
      select: { id: true, requestNumber: true, title: true, status: true },
      take: 6
    })
  ]);

  return NextResponse.json([
    ...motorRequests.map((item) => ({
      id: item.id,
      title: item.requestNumber,
      subtitle: `${item.customerFullName} - ${item.plateNumber} - ${item.status}`,
      href: `/motor-requests/${item.id}`,
      type: "motorRequest"
    })),
    ...referrals.map((item) => ({
      id: item.id,
      title: item.referralNumber,
      subtitle: `${item.applicantName ?? "-"} - ${item.status}`,
      href: `/referrals/${item.id}`,
      type: "referral"
    })),
    ...reportRequests.map((item) => ({
      id: item.id,
      title: item.requestNumber,
      subtitle: `${item.title} - ${item.status}`,
      href: "/report-requests",
      type: "reportRequest"
    }))
  ]);
}
