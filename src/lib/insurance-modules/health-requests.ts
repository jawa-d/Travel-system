import { HeartPulse } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const healthRequestStatuses = ["received", "medical_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type HealthRequestStatus = (typeof healthRequestStatuses)[number];
export type HealthRequest = InsuranceRequestView;

export const healthRequestModule: InsuranceModuleView = {
  route: "health-requests",
  title: "طلبات التأمين الصحي",
  subtitle: "إدارة طلبات Health المستلمة من بوابة التأمين الصحي.",
  productLabel: "تأمين صحي",
  icon: HeartPulse,
  statuses: healthRequestStatuses,
  statusLabels: { received: "تم الاستلام", medical_review: "مراجعة طبية", documents_check: "تدقيق المستندات الصحية", quote_preparation: "إعداد عرض صحي", contacting_customer: "التواصل مع العميل", completed: "مكتمل", rejected: "مرفوض" },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    medical_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "health-001",
    requestNumber: "HLT-REQ-2026-000301",
    trackingNumber: "HLT-REQ-2026-000301",
    status: "medical_review",
    priority: "normal",
    customer: { fullName: "Zainab Abbas", mobile: "+9647703332211", email: "zainab@example.com", nationalId: "2211448899", city: "Baghdad", address: "Mansour" },
    portalSource: "TRINSU Health Portal",
    assignedTo: "Health Desk",
    submittedAt: "2026-07-20T04:30:00.000Z",
    updatedAt: "2026-07-20T06:00:00.000Z",
    payload: { coverageTier: "Gold", membersCount: 4, chronicConditions: "Declared for one member", networkPreference: "Iraq private hospitals", annualLimit: 250000000, currency: "IQD" },
    documents: [{ key: "medicalDeclaration", label: "الإقرار الصحي", fileName: "medical-declaration.pdf", type: "application/pdf", size: "620 KB", receivedAt: "2026-07-20T04:35:00.000Z", status: "needs_review" }],
    internalNotes: []
  }]
};

export const healthRequestService = createMockInsuranceRequestService(healthRequestModule);

