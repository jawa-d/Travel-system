import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";
import {
  formatPublicMotorVehicle,
  publicMotorRequestSelect,
  publicMotorTrackingStatusLabel,
  toPublicMotorTrackingStatus
} from "@/lib/public-api/motor-requests";

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
      NextResponse.json({ message: "CORS origin is not allowed." }, { status: 403 })
    );
  }

  const auth = requirePublicApiKey(request);
  if (!auth.ok) return withPublicMotorCors(request, auth.response);

  const { trackingNumber: rawTrackingNumber } = await params;
  const trackingNumber = decodeURIComponent(rawTrackingNumber ?? "").trim();

  if (!trackingNumber) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ message: "Invalid tracking number" }, { status: 400 })
    );
  }

  const motorRequest = await prisma.motorInsuranceRequest.findUnique({
    where: { requestNumber: trackingNumber },
    select: publicMotorRequestSelect()
  });

  if (!motorRequest) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ message: "Request not found" }, { status: 404 })
    );
  }

  const status = toPublicMotorTrackingStatus(motorRequest.status);

  return withPublicMotorCors(request, NextResponse.json({
    trackingNumber: motorRequest.requestNumber,
    requestNumber: motorRequest.requestNumber,
    status,
    statusLabel: publicMotorTrackingStatusLabel(status),
    updatedAt: motorRequest.updatedAt.toISOString(),
    customerName: motorRequest.customerFullName,
    vehicle: formatPublicMotorVehicle(motorRequest)
  }));
}
