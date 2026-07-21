import { extname } from "node:path";
import { Role } from "@prisma/client";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { jsonError, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const assetSchema = z.enum(["underwriterSignature", "managerSignature", "companyStamp"]);
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function canUpload(role: Role, kind: z.infer<typeof assetSchema>) {
  if (kind === "underwriterSignature") return role === Role.SUPER_ADMIN || role === Role.UNDERWRITER;
  return role === Role.SUPER_ADMIN;
}

function safeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  const base = name.slice(0, Math.max(0, name.length - extension.length)).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${base || "asset"}${extension}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const formData = await request.formData();
    const kind = assetSchema.parse(formData.get("kind"));
    if (!canUpload(user.role, kind)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });
    if (!allowedTypes.has(file.type) || !allowedExtensions.has(extname(file.name).toLowerCase())) {
      return NextResponse.json({ error: "Only PNG, JPG, JPEG, or WEBP images are allowed." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Image must be 2 MB or less." }, { status: 400 });

    const pathname = `engineering-request-assets/${id}/${kind}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: false, contentType: file.type });
    const asset = {
      url: blob.url,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedById: user.id,
      uploadedByName: user.name ?? user.email ?? "User"
    };
    const updated = await prisma.engineeringInsuranceRequest.update({ where: { id }, data: { [kind]: asset } });
    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "ENGINEERING_REQUEST_APPROVAL_ASSET_UPLOADED",
      entity: "EngineeringInsuranceRequest",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, kind }
    });
    return NextResponse.json({ success: true, asset });
  } catch (error) {
    return jsonError(error);
  }
}
