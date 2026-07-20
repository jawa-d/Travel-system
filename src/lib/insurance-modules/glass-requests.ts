import { Gem } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const glassRequestStatuses = ["received", "property_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type GlassRequestStatus = (typeof glassRequestStatuses)[number];
export type GlassRequest = InsuranceRequestView;

export const glassRequestModule: InsuranceModuleView = {
  route: "glass-requests",
  title: "طلبات زجاج المباني",
  subtitle: "إدارة طلبات Glass المستلمة من بوابة زجاج المباني.",
  productLabel: "زجاج المباني",
  icon: Gem,
  statuses: glassRequestStatuses,
  statusLabels: { received: "تم الاستلام", property_review: "مراجعة موقع المبنى", documents_check: "تدقيق الصور والمستندات", quote_preparation: "إعداد عرض الزجاج", contacting_customer: "التواصل مع العميل", completed: "مكتمل", rejected: "مرفوض" },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    property_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "glass-001",
    requestNumber: "GLS-REQ-2026-000103",
    trackingNumber: "GLS-REQ-2026-000103",
    status: "quote_preparation",
    priority: "normal",
    customer: { fullName: "مجمع النخيل التجاري", mobile: "+9647802233445", email: "facility@nakheel.example", city: "Erbil", address: "Gulan Street" },
    portalSource: "TRINSU Building Glass Portal",
    assignedTo: "Property Team",
    submittedAt: "2026-07-18T10:45:00.000Z",
    updatedAt: "2026-07-20T06:45:00.000Z",
    payload: { buildingUse: "Commercial mall", floors: 4, glassAreaSqm: 920, glassType: "Tempered facade glass", sumInsured: 180000000, currency: "IQD" },
    documents: [{ key: "buildingPhotos", label: "صور الواجهات", fileName: "facade-photos.zip", type: "application/zip", size: "6.4 MB", receivedAt: "2026-07-18T10:49:00.000Z", status: "received" }],
    internalNotes: []
  }]
};

export const glassRequestService = createMockInsuranceRequestService(glassRequestModule);

