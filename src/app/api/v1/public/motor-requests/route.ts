import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { createPublicMotorRequest, parsePublicMotorFormData } from "@/lib/public-api/motor-requests";

export function OPTIONS(request: NextRequest) {
  return publicMotorOptions(request);
}

export async function POST(request: NextRequest) {
  if (!isPublicMotorOriginAllowed(request)) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "CORS origin is not allowed." }, { status: 403 })
    );
  }

  const auth = requirePublicApiKey(request);
  if (!auth.ok) return withPublicMotorCors(request, auth.response);

  try {
    const formData = await request.formData();
    const parsed = parsePublicMotorFormData(formData);
    const created = await createPublicMotorRequest(parsed);

    await writeAuditLog({
      action: "PUBLIC_MOTOR_REQUEST_CREATED",
      entity: "MotorInsuranceRequest",
      entityId: created.id,
      ipAddress: getIpAddress(request.headers),
      metadata: {
        requestNumber: created.requestNumber,
        status: created.status,
        apiKey: auth.apiKeyFingerprint,
        userAgent: request.headers.get("user-agent") ?? null,
        source: "Public Portal"
      }
    });

    return withPublicMotorCors(request, NextResponse.json(
      {
        success: true,
        requestId: created.id,
        trackingNumber: created.requestNumber,
        message: "Motor request created successfully."
      },
      { status: 201 }
    ));
  } catch (error) {
    return withPublicMotorCors(request, publicApiError(error));
  }
}

function publicApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Validation failed", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, message: "payload must be valid JSON." }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, message: "Duplicate request number. Please retry." }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = /required|invalid|unsupported|exceeds|empty/i.test(message) ? 400 : 500;
  return NextResponse.json({ success: false, message }, { status });
}
