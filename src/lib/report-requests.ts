import { ReportRequestStatus } from "@prisma/client";
import { z } from "zod";

export const reportRequestSchema = z.object({
  title: z.string().trim().min(4, "عنوان التقرير يجب أن يكون 4 أحرف على الأقل").max(160, "عنوان التقرير طويل جداً"),
  details: z.string().trim().min(20, "تفاصيل الطلب يجب أن تكون 20 حرفاً على الأقل").max(5000, "تفاصيل الطلب طويلة جداً")
});

export const reportRequestUpdateSchema = z.object({
  status: z.nativeEnum(ReportRequestStatus),
  managerNotes: z.string().trim().max(3000, "ملاحظات الإدارة طويلة جداً").optional().nullable()
});

export const reportRequestAllowedFileTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword"
]);

export const reportRequestAllowedFileExtensions = new Set([".pdf", ".xlsx", ".xls", ".docx", ".doc"]);

export const reportRequestStatusLabels: Record<ReportRequestStatus, string> = {
  PENDING: "بانتظار المراجعة",
  IN_REVIEW: "قيد المراجعة",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

export function createReportRequestNumber() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RR-${stamp}-${random}`;
}
