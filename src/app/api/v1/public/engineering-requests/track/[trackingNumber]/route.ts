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
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  if (!isPublicMotorOriginAllowed(request)) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "CORS origin is not allowed." }, { status: 403 })
    );
  }

  const auth = requirePublicApiKey(request);
  if (!auth.ok) return withPublicMotorCors(request, auth.response);

  const { trackingNumber: rawTrackingNumber } = await params;
  const trackingNumber = decodeURIComponent(rawTrackingNumber ?? "").trim();

  if (!trackingNumber) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "Invalid tracking number" }, { status: 400 })
    );
  }

  const engineeringRequest = await prisma.engineeringInsuranceRequest.findUnique({
    where: { requestNumber: trackingNumber },
    select: engineeringRequestSelect()
  });

  if (!engineeringRequest) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "Request not found" }, { status: 404 })
    );
  }

  const status = toPublicEngineeringTrackingStatus(engineeringRequest.status);

  return withPublicMotorCors(request, NextResponse.json({
    success: true,
    trackingNumber: engineeringRequest.requestNumber,
    requestNumber: engineeringRequest.requestNumber,
    status,
    statusLabel: publicEngineeringTrackingStatusLabel(status),
    updatedAt: engineeringRequest.updatedAt.toISOString(),
    submittedAt: engineeringRequest.createdAt.toISOString(),
    customerName: engineeringRequest.customerFullName,
    project: {
      name: engineeringRequest.projectName,
      type: engineeringRequest.projectType,
      location: engineeringRequest.projectLocation,
      insuranceType: engineeringRequest.insuranceType
    }
  }));
}
