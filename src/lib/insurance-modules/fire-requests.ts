import { Flame } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const fireRequestStatuses = ["received", "survey_required", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type FireRequestStatus = (typeof fireRequestStatuses)[number];
export type FireRequest = InsuranceRequestView;

export const fireRequestModule: InsuranceModuleView = {
  route: "fire-requests",
  title: "طلبات الحريق والسرقة",
  subtitle: "إدارة طلبات Fire & Burglary المستلمة من بوابة المنتج.",
  productLabel: "حريق وسرقة",
  icon: Flame,
  statuses: fireRequestStatuses,
  statusLabels: {
    received: "تم الاستلام",
    survey_required: "بحاجة كشف موقعي",
    documents_check: "تدقيق مستندات الملكية",
    quote_preparation: "إعداد عرض الحريق",
    contacting_customer: "التواصل مع العميل",
    completed: "مكتمل",
    rejected: "مرفوض"
  },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    survey_required: "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "fire-001",
    requestNumber: "FIR-REQ-2026-000201",
    trackingNumber: "FIR-REQ-2026-000201",
    status: "survey_required",
    priority: "high",
    customer: { fullName: "مخازن الرافدين", mobile: "+9647702211440", email: "warehouse@example.com", city: "Baghdad", address: "Industrial zone" },
    portalSource: "TRINSU Fire & Burglary Portal",
    assignedTo: "Property Team",
    submittedAt: "2026-07-20T06:40:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
    payload: { propertyUse: "Warehouse", buildingValue: 900000000, contentsValue: 420000000, burglaryLimit: 100000000, fireProtection: "Hydrants and extinguishers", currency: "IQD" },
    documents: [{ key: "propertyPhotos", label: "صور الموقع", fileName: "site-photos.zip", type: "application/zip", size: "8.1 MB", receivedAt: "2026-07-20T06:42:00.000Z", status: "needs_review" }],
    internalNotes: []
  }]
};

export const fireRequestService = createMockInsuranceRequestService(fireRequestModule);

