import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";
import { createPublicPortalRequest, parsePublicPortalJson } from "@/lib/public-api/portal-requests";
import { portalRequestTypeLabels } from "@/lib/portal-request-types";

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
    const body = await parseJsonBody(request);
    const parsed = parsePublicPortalJson(body);
    const created = await createPublicPortalRequest(parsed);

    try {
      await writeAuditLog({
        action: "PUBLIC_PORTAL_REQUEST_CREATED",
        entity: "MotorInsuranceRequest",
        entityId: created.id,
        ipAddress: getIpAddress(request.headers),
        metadata: {
          requestNumber: created.requestNumber,
          requestType: created.requestType,
          status: created.status,
          apiKey: auth.apiKeyFingerprint,
          userAgent: request.headers.get("user-agent") ?? null,
          source: "TRINSU Portal"
        }
      });
    } catch (auditError) {
      console.error("[public-portal-request] audit log failed", auditError);
    }

    return withPublicMotorCors(request, NextResponse.json(
      {
        success: true,
        requestId: created.id,
        requestNumber: created.requestNumber,
        trackingNumber: created.requestNumber,
        requestType: created.requestType,
        requestTypeLabel: portalRequestTypeLabels[created.requestType],
        status: created.status,
        uploadFailures: created.uploadFailures,
        message: "Request submitted successfully"
      },
      { status: 201 }
    ));
  } catch (error) {
    return withPublicMotorCors(request, publicPortalApiError(error));
  }
}

async function parseJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }

  try {
    return await request.json();
  } catch (error) {
    console.error("[public-portal-request] JSON parsing failed", error);
    throw new Error("Request body must be valid JSON.");
  }
}

function publicPortalApiError(error: unknown) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    const message = details.map((issue) => issue.message).join("; ") || "Validation failed";
    return NextResponse.json({ success: false, error: message, message, details }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { success: false, error: "Unable to create request because a unique value already exists.", message: "Unable to create request because a unique value already exists." },
      { status: 409 }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = /required|invalid|unsupported|exceeds|empty|content-type|json/i.test(message) ? 400 : 500;
  console.error("[public-portal-request] request failed", error);
  return NextResponse.json({ success: false, error: message, message }, { status });
}
