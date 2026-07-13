import { extname } from "node:path";
import { Role } from "@prisma/client";
import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";

type ReferralAttachment = {
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedById: string;
  uploadedByName: string;
};

const allowedTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xls", ".xlsx"]);
const deleteSchema = z.object({ url: z.string().url() });

function canManageAttachments(role: Role) {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.UNDERWRITER || role === Role.FINANCE;
}

function safeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  const base = name.slice(0, Math.max(0, name.length - extension.length)).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${base || "attachment"}${extension}`;
}

function attachmentsFrom(value: unknown): ReferralAttachment[] {
  return Array.isArray(value) ? value.filter((item): item is ReferralAttachment => Boolean(item && typeof item === "object" && "url" in item)) : [];
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canManageAttachments(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });
    const extension = extname(file.name).toLowerCase();
    if (!allowedExtensions.has(extension) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Unsupported attachment type." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "File must be 12 MB or less." }, { status: 400 });

    const referral = await prisma.referral.findUnique({ where: { id }, select: { referralNumber: true, takafulAttachments: true } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pathname = `referral-attachments/${id}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: false, contentType: file.type });
    const attachment: ReferralAttachment = {
      url: blob.url,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedById: user.id,
      uploadedByName: user.name ?? user.email ?? "User"
    };

    const updated = await prisma.referral.update({
      where: { id },
      data: { takafulAttachments: [...attachmentsFrom(referral.takafulAttachments), attachment] },
      select: { takafulAttachments: true }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_TAKAFUL_ATTACHMENT_UPLOADED",
      entity: "Referral",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: referral.referralNumber, fileName: file.name }
    });

    return NextResponse.json({ success: true, attachments: updated.takafulAttachments });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canManageAttachments(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const payload = deleteSchema.parse(await request.json());
    const referral = await prisma.referral.findUnique({ where: { id }, select: { referralNumber: true, takafulAttachments: true } });
    if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const attachments = attachmentsFrom(referral.takafulAttachments);
    const nextAttachments = attachments.filter((item) => item.url !== payload.url);
    if (nextAttachments.length === attachments.length) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    await del(payload.url).catch(() => undefined);
    const updated = await prisma.referral.update({
      where: { id },
      data: { takafulAttachments: nextAttachments },
      select: { takafulAttachments: true }
    });

    await writeAuditLog({
      userId: user.id,
      role: user.role,
      action: "REFERRAL_TAKAFUL_ATTACHMENT_DELETED",
      entity: "Referral",
      entityId: id,
      ipAddress: getIpAddress(request.headers),
      metadata: { referralNumber: referral.referralNumber, url: payload.url }
    });

    return NextResponse.json({ success: true, attachments: updated.takafulAttachments });
  } catch (error) {
    return jsonError(error);
  }
}
