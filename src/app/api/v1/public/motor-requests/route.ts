import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { createPublicMotorRequest, parsePublicMotorJson } from "@/lib/public-api/motor-requests";
import { deleteMotorBlobFiles } from "@/lib/public-api/motor-files";

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

  let requestBody: unknown;
  let cleanupHandledByCreate = false;
  try {
    logStage("request received", { method: request.method, url: request.url });
    requestBody = await parseJsonBody(request);
    const parsed = parsePublicMotorJson(requestBody);
    logStage("payload parsed", {
      vehicleImageCount: parsed.vehicleImages.length,
      documentCount: parsed.documents.length,
      customerName: parsed.payload.customer.fullName
    });
    logStage("validation passed", {
      customerEmail: parsed.payload.customer.email || null,
      agentCode: parsed.payload.agentCode || null
    });

    const blobDebug = blobCredentialDebug();
    console.log("Blob credential debug", blobDebug);
    cleanupHandledByCreate = true;
    const created = await createPublicMotorRequest(parsed);

    logStage("success response returned", {
      requestId: created.id,
      requestNumber: created.requestNumber,
      status: created.status
    });

    try {
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
    } catch (auditError) {
      console.error("[public-motor-request] audit log failed", auditError);
    }

    return withPublicMotorCors(request, NextResponse.json(
      {
        success: true,
        requestId: created.id,
        requestNumber: created.requestNumber,
        trackingNumber: created.requestNumber,
        uploadFailures: created.uploadFailures,
        message: "Request submitted successfully",
        ...nonProductionDebug(blobDebug)
      },
      { status: 201 }
    ));
  } catch (error) {
    if (!cleanupHandledByCreate) await cleanupSubmittedBlobUrls(requestBody);
    return withPublicMotorCors(request, publicApiError(error, blobCredentialDebug()));
  }
}

async function parseJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new Error("Multipart uploads are no longer accepted. Upload files directly to Vercel Blob, then submit JSON metadata.");
  }
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }

  try {
    return await request.json();
  } catch (error) {
    console.error("[public-motor-request] JSON parsing failed", error);
    throw new Error("Request body must be valid JSON.");
  }
}

function logStage(stage: string, details?: Record<string, unknown>) {
  console.log(`[public-motor-request] ${stage}`, details ?? {});
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

async function cleanupSubmittedBlobUrls(input: unknown) {
  if (!input || typeof input !== "object") return;
  const record = input as {
    vehicleImages?: Array<{ url?: unknown }>;
    documents?: Array<{ url?: unknown }>;
  };
  const urls = [...(record.vehicleImages ?? []), ...(record.documents ?? [])]
    .map((file) => file.url)
    .filter((url): url is string => typeof url === "string" && /^https:\/\//i.test(url));
  if (!urls.length) return;
  await deleteMotorBlobFiles(urls.map((url) => ({ url })));
}

function publicApiError(error: unknown, debug?: ReturnType<typeof blobCredentialDebug>) {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    const message = details.map((issue) => issue.message).join("; ") || "Validation failed";
    return NextResponse.json(
      { success: false, error: message, message, details, ...nonProductionDebug(debug ?? blobCredentialDebug()) },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ success: false, error: "payload must be valid JSON.", message: "payload must be valid JSON.", ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    console.error("[public-motor-request] unique constraint conflict", {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({ success: false, error: "Unable to create request because a unique value already exists.", message: "Unable to create request because a unique value already exists.", ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status: 409 });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  if (/numeric field overflow|precision 12, scale 2|less than 10\^10/i.test(message)) {
    return NextResponse.json(
      { success: false, error: "Estimated vehicle value exceeds the maximum allowed amount.", message: "Estimated vehicle value exceeds the maximum allowed amount.", ...nonProductionDebug(debug ?? blobCredentialDebug()) },
      { status: 400 }
    );
  }
  console.error("[public-motor-request] request failed", {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined
  });
  const status = /multipart uploads are no longer accepted/i.test(message)
    ? 415
    : /required|invalid|unsupported|exceeds|empty|content-type|json/i.test(message) ? 400 : 500;
  return NextResponse.json({ success: false, error: message, message, ...nonProductionDebug(debug ?? blobCredentialDebug()) }, { status });
}
