import { extname } from "node:path";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requirePermission } from "@/lib/api";
import { getIpAddress, writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  reportRequestAllowedFileExtensions,
  reportRequestAllowedFileTypes,
  reportRequestUpdateSchema
} from "@/lib/report-requests";

function safeFileName(name: string) {
  const extension = extname(name).toLowerCase();
  const base = name.slice(0, Math.max(0, name.length - extension.length)).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${base || "report"}${extension}`;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("reportRequestsManage");
    const { id } = await params;
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "save");
    const payload = reportRequestUpdateSchema.parse({
      status: formData.get("status"),
      managerNotes: formData.get("managerNotes")
    });
    const file = formData.get("reportFile");
    const reviewer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, role: true }
    });
    const current = await prisma.reportRequest.findUnique({
      where: { id },
      select: { requestNumber: true, isLocked: true }
    });
    if (!current) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (current.isLocked) return NextResponse.json({ error: "الطلب مقفل ولا يمكن تعديله" }, { status: 423 });

    let reportFileData: {
      reportFileUrl: string;
      reportFileName: string;
      reportFileType: string;
      reportFileSize: number;
      reportFileUploadedAt: Date;
    } | undefined;
    if (file instanceof File && file.size > 0) {
      const extension = extname(file.name).toLowerCase();
      if (!reportRequestAllowedFileExtensions.has(extension) || !reportRequestAllowedFileTypes.has(file.type)) {
        return NextResponse.json({ error: "نوع ملف التقرير غير مدعوم" }, { status: 400 });
      }
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "حجم ملف التقرير يجب ألا يتجاوز 15 MB" }, { status: 400 });
      }
      const pathname = `report-requests/${id}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const blob = await put(pathname, file, { access: "public", addRandomSuffix: false, contentType: file.type });
      reportFileData = {
        reportFileUrl: blob.url,
        reportFileName: file.name,
        reportFileType: file.type,
        reportFileSize: file.size,
        reportFileUploadedAt: new Date()
      };
    }

    const updated = await prisma.reportRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNotes: payload.managerNotes || null,
        ...reportFileData,
        ...(action === "lock" ? {
          isLocked: true,
          lockedAt: new Date(),
          lockedById: reviewer?.id ?? null,
          lockedByName: reviewer?.name ?? user.name ?? null
        } : {}),
        reviewedById: reviewer?.id ?? null,
        reviewedByName: reviewer?.name ?? user.name ?? null,
        reviewedAt: new Date()
      },
      select: { id: true, requestNumber: true, status: true }
    });

    await writeAuditLog({
      userId: reviewer?.id ?? null,
      role: reviewer?.role ?? user.role,
      action: "REPORT_REQUEST_UPDATED",
      entity: "ReportRequest",
      entityId: updated.id,
      ipAddress: getIpAddress(request.headers),
      metadata: { requestNumber: updated.requestNumber, status: updated.status, action, fileName: reportFileData?.reportFileName }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}
