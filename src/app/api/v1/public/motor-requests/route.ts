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
    const blobDebug = blobCredentialDebug();
    console.log("Blob credential debug", blobDebug);
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
        requestNumber: created.requestNumber,
        trackingNumber: created.requestNumber,
        message: "Request submitted successfully",
        ...nonProductionDebug(blobDebug)
      },
      { status: 201 }
    ));
  } catch (error) {
    return withPublicMotorCors(request, publicApiError(error, blobCredentialDebug()));
  }
}

function blobCredentialDebug() {
  return {
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "exists" : "missing",
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN ? "exists" : "missing"
  };
}

function nonProductionDebug(debug: ReturnType<typeof blobCredentialDebug>) {
  return process.env.NODE_ENV !== "production" ? { debug } : {};
}

function publicApiError(error: unknown, debug?: ReturnType<typeof blobCredentialDebug>) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Validation failed", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })), ...nonProductionDebug(debug ?? blobCredentialDebug()) },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, message: "payload must be valid JSON.", ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, message: "Duplicate request number. Please retry.", ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = /required|invalid|unsupported|exceeds|empty/i.test(message) ? 400 : 500;
  return NextResponse.json({ success: false, message, ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status });
}
