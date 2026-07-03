import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatPublicMotorVehicle,
  publicMotorRequestSelect,
  publicMotorTrackingStatusLabel,
  toPublicMotorTrackingStatus
} from "@/lib/public-api/motor-requests";

export async function GET(request: NextRequest) {
  const trackingNumber = request.nextUrl.searchParams.get("trackingNumber")?.trim();

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, message: "Invalid tracking number" },
      { status: 400 }
    );
  }

  const motorRequest = await prisma.motorInsuranceRequest.findUnique({
    where: { requestNumber: trackingNumber },
    select: publicMotorRequestSelect()
  });

  if (!motorRequest) {
    return NextResponse.json(
      { success: false, message: "Request not found" },
      { status: 404 }
    );
  }

  const status = toPublicMotorTrackingStatus(motorRequest.status);
  const response = {
    trackingNumber: motorRequest.requestNumber,
    requestNumber: motorRequest.requestNumber,
    status,
    statusLabel: publicMotorTrackingStatusLabel(status),
    updatedAt: motorRequest.updatedAt.toISOString(),
    customerName: motorRequest.customerFullName,
    vehicle: formatPublicMotorVehicle(motorRequest)
  };

  return NextResponse.json({
    success: true,
    ...response,
    request: response
  });
}
