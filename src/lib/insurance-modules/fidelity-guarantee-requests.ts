import { UserRoundCheck } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const fidelityGuaranteeRequestStatuses = ["received", "employee_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type FidelityGuaranteeRequestStatus = (typeof fidelityGuaranteeRequestStatuses)[number];
export type FidelityGuaranteeRequest = InsuranceRequestView;

export const fidelityGuaranteeRequestModule: InsuranceModuleView = {
  route: "fidelity-guarantee-requests",
  title: "طلبات خيانة الأمانة",
  subtitle: "إدارة طلبات Fidelity Guarantee المستلمة من بوابة المنتج.",
  productLabel: "خيانة الأمانة",
  icon: UserRoundCheck,
  statuses: fidelityGuaranteeRequestStatuses,
  statusLabels: { received: "تم الاستلام", employee_review: "مراجعة الموظفين", documents_check: "تدقيق مستندات العاملين", quote_preparation: "إعداد العرض", contacting_customer: "التواصل مع العميل", completed: "مكتمل", rejected: "مرفوض" },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    employee_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "fidelity-001",
    requestNumber: "FDL-REQ-2026-000104",
    trackingNumber: "FDL-REQ-2026-000104",
    status: "received",
    priority: "high",
    customer: { fullName: "شركة دجلة للتوزيع", mobile: "+9647509001100", email: "hr@dijla.example", city: "Baghdad", address: "Mansour" },
    portalSource: "TRINSU Fidelity Guarantee Portal",
    assignedTo: "Unassigned",
    submittedAt: "2026-07-20T05:30:00.000Z",
    updatedAt: "2026-07-20T05:30:00.000Z",
    payload: { employeeCount: 28, coveredPositions: ["Cashiers", "Warehouse supervisors"], requestedLimit: 50000000, currency: "IQD", priorLosses: "None declared" },
    documents: [],
    internalNotes: []
  }]
};

export const fidelityGuaranteeRequestService = createMockInsuranceRequestService(fidelityGuaranteeRequestModule);

