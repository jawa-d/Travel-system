import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { createPublicMotorRequest, parsePublicMotorFormData } from "@/lib/public-api/motor-requests";

export async function POST(request: NextRequest) {
  const auth = requirePublicApiKey(request);
  if (!auth.ok) return auth.response;

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

    return NextResponse.json(
      {
        success: true,
        requestNumber: created.requestNumber,
        status: "Submitted",
        message: "Motor insurance request submitted successfully."
      },
      { status: 200 }
    );
  } catch (error) {
    return publicApiError(error);
  }
}

function publicApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, error: "payload must be valid JSON." }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, error: "Duplicate request number. Please retry." }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = /required|invalid|unsupported|exceeds|empty/i.test(message) ? 400 : 500;
  return NextResponse.json({ success: false, error: message }, { status });
}
