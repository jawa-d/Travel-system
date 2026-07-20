import { Building2 } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const propertyRequestStatuses = ["received", "property_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type PropertyRequestStatus = (typeof propertyRequestStatuses)[number];
export type PropertyRequest = InsuranceRequestView;

export const propertyRequestModule: InsuranceModuleView = {
  route: "property-requests",
  title: "طلبات تأمين الممتلكات",
  subtitle: "إدارة طلبات Property المستلمة من بوابة الممتلكات.",
  productLabel: "تأمين ممتلكات",
  icon: Building2,
  statuses: propertyRequestStatuses,
  statusLabels: { received: "تم الاستلام", property_review: "مراجعة الممتلكات", documents_check: "تدقيق مستندات الملكية", quote_preparation: "إعداد عرض الممتلكات", contacting_customer: "التواصل مع العميل", completed: "مكتمل", rejected: "مرفوض" },
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
    id: "property-001",
    requestNumber: "PRP-REQ-2026-000302",
    trackingNumber: "PRP-REQ-2026-000302",
    status: "received",
    priority: "normal",
    customer: { fullName: "شركة البساتين العقارية", mobile: "+9647807002211", email: "property@basateen.example", city: "Baghdad", address: "Airport Road" },
    portalSource: "TRINSU Property Portal",
    assignedTo: "Property Team",
    submittedAt: "2026-07-20T03:15:00.000Z",
    updatedAt: "2026-07-20T03:15:00.000Z",
    payload: { propertyType: "Office building", constructionYear: 2018, buildingValue: 1500000000, contentsValue: 300000000, requestedCovers: ["Fire", "Natural perils", "Water damage"], currency: "IQD" },
    documents: [],
    internalNotes: []
  }]
};

export const propertyRequestService = createMockInsuranceRequestService(propertyRequestModule);

