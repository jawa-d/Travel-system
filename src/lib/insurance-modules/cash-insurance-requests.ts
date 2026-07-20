import { Wallet } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const cashInsuranceRequestStatuses = ["received", "security_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type CashInsuranceRequestStatus = (typeof cashInsuranceRequestStatuses)[number];
export type CashInsuranceRequest = InsuranceRequestView;

export const cashInsuranceRequestModule: InsuranceModuleView = {
  route: "cash-insurance-requests",
  title: "طلبات تأمين النقد",
  subtitle: "إدارة طلبات Cash Insurance المستلمة من بوابة حفظ النقد.",
  productLabel: "حفظ النقد",
  icon: Wallet,
  statuses: cashInsuranceRequestStatuses,
  statusLabels: { received: "تم الاستلام", security_review: "مراجعة الحماية", documents_check: "تدقيق المستندات", quote_preparation: "إعداد عرض النقد", contacting_customer: "التواصل مع العميل", completed: "مكتمل", rejected: "مرفوض" },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    security_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "cash-001",
    requestNumber: "CSH-REQ-2026-000105",
    trackingNumber: "CSH-REQ-2026-000105",
    status: "contacting_customer",
    priority: "urgent",
    customer: { fullName: "مكتب اليسر للصرافة", mobile: "+9647705558881", email: "cash@alyusr.example", city: "Najaf", address: "Old City" },
    portalSource: "TRINSU Cash Insurance Portal",
    assignedTo: "Risk Control",
    submittedAt: "2026-07-17T14:05:00.000Z",
    updatedAt: "2026-07-20T08:05:00.000Z",
    payload: { safeType: "Certified steel safe", maxCashLimit: 120000000, currency: "IQD", alarmSystem: true, guardService: true, premisesOpenHours: "09:00-18:00" },
    documents: [{ key: "safeInvoice", label: "فاتورة الخزنة", fileName: "safe-invoice.pdf", type: "application/pdf", size: "340 KB", receivedAt: "2026-07-17T14:07:00.000Z", status: "received" }],
    internalNotes: []
  }]
};

export const cashInsuranceRequestService = createMockInsuranceRequestService(cashInsuranceRequestModule);

