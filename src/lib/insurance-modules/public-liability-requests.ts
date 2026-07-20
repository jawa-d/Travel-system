import { ShieldAlert } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const publicLiabilityRequestStatuses = ["received", "under_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type PublicLiabilityRequestStatus = (typeof publicLiabilityRequestStatuses)[number];
export type PublicLiabilityRequest = InsuranceRequestView;

export const publicLiabilityRequestModule: InsuranceModuleView = {
  route: "public-liability-requests",
  title: "طلبات المسؤولية المدنية",
  subtitle: "إدارة دورة طلبات المسؤولية المدنية المستلمة من بوابة TRINSU.",
  productLabel: "مسؤولية مدنية",
  icon: ShieldAlert,
  statuses: publicLiabilityRequestStatuses,
  statusLabels: {
    received: "تم الاستلام",
    under_review: "قيد مراجعة المسؤولية",
    documents_check: "تدقيق مستندات النشاط",
    quote_preparation: "إعداد عرض المسؤولية",
    contacting_customer: "التواصل مع العميل",
    completed: "مكتمل",
    rejected: "مرفوض"
  },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    under_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "public-liability-001",
    requestNumber: "PLI-REQ-2026-000101",
    trackingNumber: "PLI-REQ-2026-000101",
    status: "under_review",
    priority: "high",
    customer: { fullName: "شركة الرافدين للمقاولات", mobile: "+9647701122334", email: "ops@rafidain.example", nationalId: "1029384756", city: "Baghdad", address: "Al-Karrada" },
    portalSource: "TRINSU Public Liability Portal",
    assignedTo: "Casualty Team",
    submittedAt: "2026-07-20T08:10:00.000Z",
    updatedAt: "2026-07-20T09:35:00.000Z",
    payload: { businessActivity: "General contracting", coverageLimit: 75000000, currency: "IQD", insuranceFrom: "2026-08-01", insuranceTo: "2027-08-01", riskDescription: "Third-party injury and property damage exposure." },
    documents: [{ key: "commercialLicense", label: "إجازة ممارسة العمل", fileName: "commercial-license.pdf", type: "application/pdf", size: "1.2 MB", receivedAt: "2026-07-20T08:11:00.000Z", status: "received" }],
    internalNotes: [{ id: "pli-note-1", author: "Admin", body: "Mock payload for future Public Liability Portal API.", createdAt: "2026-07-20T09:00:00.000Z" }]
  }]
};

export const publicLiabilityRequestService = createMockInsuranceRequestService(publicLiabilityRequestModule);

