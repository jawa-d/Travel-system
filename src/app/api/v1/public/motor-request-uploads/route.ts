import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePublicApiKey } from "@/lib/public-api/auth";
import { isPublicMotorOriginAllowed, publicMotorOptions, withPublicMotorCors } from "@/lib/public-api/cors";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_TYPES,
  deleteMotorBlobFiles,
  maxPublicMotorFileSize,
  normalizedPublicMotorContentType,
  safePublicMotorFileName
} from "@/lib/public-api/motor-files";

const FALLBACK_UPLOAD_CONTENT_TYPES = ["application/octet-stream"];

const uploadClientPayloadSchema = z.object({
  kind: z.enum(["vehicleImage", "document"]),
  key: z.string().trim().min(1).max(80).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(240).optional(),
  type: z.string().trim().min(1).max(120).optional(),
  size: z.coerce.number().int().positive().optional()
});

const cleanupSchema = z.object({
  urls: z.array(z.string().url()).max(32)
});

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
    const body = await request.json() as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseUploadClientPayload(clientPayload);
        validateUploadPathname(pathname, payload);

        return {
          allowedContentTypes: [
            ...Array.from(payload.kind === "vehicleImage" ? IMAGE_TYPES : DOCUMENT_TYPES),
            ...FALLBACK_UPLOAD_CONTENT_TYPES
          ],
          maximumSizeInBytes: maxPublicMotorFileSize(),
          addRandomSuffix: true,
          tokenPayload: clientPayload
        };
      }
    });

    return withPublicMotorCors(request, NextResponse.json(json));
  } catch (error) {
    return withPublicMotorCors(request, uploadError(error));
  }
}

export async function DELETE(request: NextRequest) {
  if (!isPublicMotorOriginAllowed(request)) {
    return withPublicMotorCors(
      request,
      NextResponse.json({ success: false, message: "CORS origin is not allowed." }, { status: 403 })
    );
  }

  const auth = requirePublicApiKey(request);
  if (!auth.ok) return withPublicMotorCors(request, auth.response);

  try {
    const payload = cleanupSchema.parse(await request.json());
    await deleteMotorBlobFiles(payload.urls.map((url) => ({ url })));
    return withPublicMotorCors(request, NextResponse.json({ success: true }));
  } catch (error) {
    return withPublicMotorCors(request, uploadError(error));
  }
}

function parseUploadClientPayload(clientPayload: string | null) {
  if (!clientPayload) throw new Error("Upload client payload is required.");
  return uploadClientPayloadSchema.parse(JSON.parse(clientPayload));
}

function validateUploadPathname(pathname: string, payload: z.infer<typeof uploadClientPayloadSchema>) {
  if (!pathname.startsWith("public-motor-requests/uploads/")) {
    throw new Error("Upload pathname must start with public-motor-requests/uploads/.");
  }
  if (pathname.includes("..") || pathname.includes("\\")) {
    throw new Error("Upload pathname is invalid.");
  }

  const fileName = pathname.split("/").at(-1) ?? "";
  const safeName = safePublicMotorFileName(payload.name ?? fileName);
  if (!safeName || safeName === "file") throw new Error("Upload filename is invalid.");

  const types = payload.kind === "vehicleImage" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const extensions = payload.kind === "vehicleImage" ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
  const extension = `.${fileName.split(".").at(-1)?.toLowerCase() ?? ""}`;
  const contentType = normalizedPublicMotorContentType(
    { name: payload.name ?? fileName, type: payload.type ?? "" },
    types,
    extensions
  );

  if (!extensions.has(extension)) throw new Error("Upload file extension is not allowed.");
  if (!types.has(contentType)) throw new Error("Upload content type is not allowed.");
  if (payload.size && payload.size > maxPublicMotorFileSize()) throw new Error("Upload file exceeds the maximum allowed size.");
}

function uploadError(error: unknown) {
  const message = error instanceof z.ZodError
    ? error.issues.map((issue) => issue.message).join("; ")
    : error instanceof SyntaxError ? "Request body must be valid JSON." : error instanceof Error ? error.message : "Upload request failed.";
  const status = /required|invalid|not allowed|exceeds|json|pathname|filename|extension|content type/i.test(message) ? 400 : 500;
  return NextResponse.json({ success: false, error: message, message }, { status });
}
