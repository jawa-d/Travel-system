import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { publicMotorRequestSelect } from "@/lib/public-api/motor-requests";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  const auth = requirePublicApiKey(request);
  if (!auth.ok) return auth.response;

  const { requestNumber } = await params;
  const motorRequest = await prisma.motorInsuranceRequest.findUnique({
    where: { requestNumber },
    select: publicMotorRequestSelect()
  });

  if (!motorRequest) {
    return NextResponse.json({ success: false, error: "Motor insurance request not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    requestNumber: motorRequest.requestNumber,
    status: publicStatus(motorRequest.status),
    source: motorRequest.source,
    customer: {
      fullName: motorRequest.customerFullName,
      mobile: motorRequest.customerMobile,
      email: motorRequest.customerEmail,
      nationalId: motorRequest.customerNationalId,
      city: motorRequest.customerCity
    },
    vehicle: {
      vehicleType: motorRequest.vehicleType,
      manufacturer: motorRequest.manufacturer,
      model: motorRequest.model,
      plateNumber: motorRequest.plateNumber
    },
    submittedAt: motorRequest.createdAt,
    updatedAt: motorRequest.updatedAt
  });
}

function publicStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
