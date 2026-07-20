import { BriefcaseBusiness } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const workersCompensationRequestStatuses = ["received", "payroll_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type WorkersCompensationRequestStatus = (typeof workersCompensationRequestStatuses)[number];
export type WorkersCompensationRequest = InsuranceRequestView;

export const workersCompensationRequestModule: InsuranceModuleView = {
  route: "workers-compensation-requests",
  title: "طلبات إصابات العمال",
  subtitle: "إدارة طلبات Workers Compensation بدورة عمل مستقلة عن بقية المنتجات.",
  productLabel: "إصابات العمال",
  icon: BriefcaseBusiness,
  statuses: workersCompensationRequestStatuses,
  statusLabels: { received: "تم الاستلام", payroll_review: "مراجعة الرواتب", documents_check: "تدقيق كشف العمال", quote_preparation: "إعداد العرض", contacting_customer: "التواصل مع صاحب العمل", completed: "مكتمل", rejected: "مرفوض" },
  statusClasses: {
    received: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200",
    payroll_review: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950 dark:text-cyan-200",
    documents_check: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    quote_preparation: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200",
    contacting_customer: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200",
    completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
  },
  requests: [{
    id: "workers-001",
    requestNumber: "WRK-REQ-2026-000108",
    trackingNumber: "WRK-REQ-2026-000108",
    status: "rejected",
    priority: "normal",
    customer: { fullName: "معمل السلام للأغذية", mobile: "+9647706611223", email: "admin@salam-food.example", city: "Karbala", address: "Industrial district" },
    portalSource: "TRINSU Workers Compensation Portal",
    assignedTo: "Casualty Team",
    submittedAt: "2026-07-10T08:30:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
    payload: { workersCount: 142, payrollAmount: 980000000, currency: "IQD", workNature: "Food manufacturing", shiftPattern: "Two shifts", safetyProgram: true },
    documents: [{ key: "employeeSchedule", label: "كشف العمال", fileName: "workers-list.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: "780 KB", receivedAt: "2026-07-10T08:33:00.000Z", status: "received" }],
    internalNotes: [{ id: "workers-note-1", author: "Underwriter", body: "Rejected in mock data because payroll declaration is incomplete.", createdAt: "2026-07-11T09:55:00.000Z" }]
  }]
};

export const workersCompensationRequestService = createMockInsuranceRequestService(workersCompensationRequestModule);

