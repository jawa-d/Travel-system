import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  engineeringRequestSelect,
  publicEngineeringTrackingStatusLabel,
  toPublicEngineeringTrackingStatus
} from "@/lib/engineering-requests";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";

export function OPTIONS(request: NextRequest) {
  return publicMotorOptions(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  if (!isPublicMotorOriginAllowed(request)) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "CORS origin is not allowed." }, { status: 403 })
    );
  }

  const auth = requirePublicApiKey(request);
  if (!auth.ok) return withPublicMotorCors(request, auth.response);

  const { requestNumber: rawRequestNumber } = await params;
  const requestNumber = decodeURIComponent(rawRequestNumber ?? "").trim();

  if (!requestNumber) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "Invalid request number" }, { status: 400 })
    );
  }

  const engineeringRequest = await prisma.engineeringInsuranceRequest.findUnique({
    where: { requestNumber },
    select: engineeringRequestSelect()
  });

  if (!engineeringRequest) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "Engineering insurance request not found." }, { status: 404 })
    );
  }

  const status = toPublicEngineeringTrackingStatus(engineeringRequest.status);

  return withPublicMotorCors(request, NextResponse.json({
    success: true,
    trackingNumber: engineeringRequest.requestNumber,
    requestNumber: engineeringRequest.requestNumber,
    status,
    statusLabel: publicEngineeringTrackingStatusLabel(status),
    source: engineeringRequest.source,
    customer: {
      fullName: engineeringRequest.customerFullName,
      mobile: engineeringRequest.customerMobile,
      email: engineeringRequest.customerEmail,
      nationalId: engineeringRequest.customerNationalId,
      city: engineeringRequest.customerCity
    },
    project: {
      name: engineeringRequest.projectName,
      type: engineeringRequest.projectType,
      location: engineeringRequest.projectLocation,
      contractValue: String(engineeringRequest.contractValue),
      currency: engineeringRequest.currency,
      insuranceType: engineeringRequest.insuranceType
    },
    submittedAt: engineeringRequest.createdAt.toISOString(),
    updatedAt: engineeringRequest.updatedAt.toISOString()
  }));
}
