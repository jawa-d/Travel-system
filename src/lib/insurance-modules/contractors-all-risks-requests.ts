import { Construction } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const contractorsAllRisksRequestStatuses = ["received", "engineering_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type ContractorsAllRisksRequestStatus = (typeof contractorsAllRisksRequestStatuses)[number];
export type ContractorsAllRisksRequest = InsuranceRequestView;

export const contractorsAllRisksRequestModule: InsuranceModuleView = {
  route: "contractors-all-risks-requests",
  title: "طلبات جميع أخطار المقاولين",
  subtitle: "إدارة مستقلة لطلبات Contractors All Risks المستلمة من البوابة.",
  productLabel: "جميع أخطار المقاولين",
  icon: Construction,
  statuses: contractorsAllRisksRequestStatuses,
  statusLabels: {
    received: "تم الاستلام",
    engineering_review: "مراجعة هندسية",
    documents_check: "تدقيق مستندات المشروع",
    quote_preparation: "إعداد عرض هندسي",
    contacting_customer: "التواصل مع العميل",
    completed: "مكتمل",
    rejected: "مرفوض"
  },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    engineering_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "car-001",
    requestNumber: "CAR-REQ-2026-000106",
    trackingNumber: "CAR-REQ-2026-000106",
    status: "engineering_review",
    priority: "high",
    customer: { fullName: "شركة الفاو الهندسية", mobile: "+9647812223344", email: "projects@fao.example", city: "Mosul", address: "Project site zone B" },
    portalSource: "TRINSU Contractors All Risks Portal",
    assignedTo: "Engineering Team",
    submittedAt: "2026-07-16T09:15:00.000Z",
    updatedAt: "2026-07-20T06:25:00.000Z",
    payload: { projectName: "Water treatment plant", contractValue: 3200000000, currency: "IQD", projectDurationMonths: 18, maintenancePeriodMonths: 12, principalName: "Municipality Directorate" },
    documents: [{ key: "boq", label: "جدول الكميات", fileName: "boq.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: "910 KB", receivedAt: "2026-07-16T09:20:00.000Z", status: "received" }],
    internalNotes: []
  }]
};

export const contractorsAllRisksRequestService = createMockInsuranceRequestService(contractorsAllRisksRequestModule);

