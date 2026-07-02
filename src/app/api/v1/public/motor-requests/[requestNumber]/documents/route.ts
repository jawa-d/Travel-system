import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePublicApiKey } from "@/lib/public-api/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestNumber: string }> }
) {
  const auth = requirePublicApiKey(request);
  if (!auth.ok) return auth.response;

  const { requestNumber } = await params;
  const motorRequest = await prisma.motorInsuranceRequest.findUnique({
    where: { requestNumber },
    select: {
      requestNumber: true,
      vehicleImages: true,
      customerDocuments: true
    }
  });

  if (!motorRequest) {
    return NextResponse.json({ success: false, error: "Motor insurance request not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    requestNumber: motorRequest.requestNumber,
    vehicleImages: motorRequest.vehicleImages,
    customerDocuments: motorRequest.customerDocuments
  });
}
