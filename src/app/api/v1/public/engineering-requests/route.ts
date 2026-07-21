import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { createEngineeringInsuranceRequest, parseEngineeringRequestJson } from "@/lib/engineering-requests";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";

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
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return withPublicMotorCors(
        request,
        NextResponse.json({ success: false, message: "Content-Type must be application/json." }, { status: 415 })
      );
    }

    const parsed = parseEngineeringRequestJson(await request.json());
    const created = await createEngineeringInsuranceRequest(parsed, "Public Engineering Portal");

    try {
      await writeAuditLog({
        action: "PUBLIC_ENGINEERING_REQUEST_CREATED",
        entity: "EngineeringInsuranceRequest",
        entityId: created.id,
        ipAddress: getIpAddress(request.headers),
        metadata: {
          requestNumber: created.requestNumber,
          status: created.status,
          apiKey: auth.apiKeyFingerprint,
          source: "Public Engineering Portal"
        }
      });
    } catch (auditError) {
      console.error("[public-engineering-request] audit log failed", auditError);
    }

    return withPublicMotorCors(request, NextResponse.json({
      success: true,
      requestId: created.id,
      requestNumber: created.requestNumber,
      trackingNumber: created.requestNumber,
      status: created.status,
      message: "Request submitted successfully"
    }, { status: 201 }));
  } catch (error) {
    return withPublicMotorCors(request, publicApiError(error));
  }
}

function publicApiError(error: unknown) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    const message = details.map((issue) => issue.message).join("; ") || "Validation failed";
    return NextResponse.json({ success: false, message, details }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ success: false, message: "Unable to create request because a unique value already exists." }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ success: false, message }, { status: 500 });
}
