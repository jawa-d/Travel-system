import { Plane } from "lucide-react";
import { createMockInsuranceRequestService, type InsuranceModuleView, type InsuranceRequestView } from "@/lib/insurance-request-ui";

export const travelRequestStatuses = ["received", "under_review", "documents_check", "quote_preparation", "contacting_customer", "completed", "rejected"] as const;
export type TravelRequestStatus = (typeof travelRequestStatuses)[number];
export type TravelRequest = InsuranceRequestView;

export const travelRequestModule: InsuranceModuleView = {
  route: "travel-requests",
  title: "طلبات تأمين السفر",
  subtitle: "إدارة طلبات السفر المستلمة من بوابة السفر فقط، بدون إنشاء أو تعديل استمارة البوابة داخل الإدارة.",
  productLabel: "تأمين سفر",
  icon: Plane,
  statuses: travelRequestStatuses,
  statusLabels: {
    received: "تم الاستلام",
    under_review: "قيد مراجعة السفر",
    documents_check: "تدقيق الجوازات",
    quote_preparation: "إعداد عرض السفر",
    contacting_customer: "التواصل مع المسافر",
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
  requests: [
    {
      id: "travel-001",
      requestNumber: "TRV-REQ-2026-000102",
      trackingNumber: "TRV-REQ-2026-000102",
      status: "documents_check",
      priority: "normal",
      customer: { fullName: "Ali Hassan", mobile: "+9647710004455", email: "ali@example.com", nationalId: "5566778899", city: "Basra", address: "Ashar" },
      portalSource: "TRINSU Travel Portal",
      assignedTo: "Travel Desk",
      submittedAt: "2026-07-19T12:20:00.000Z",
      updatedAt: "2026-07-20T07:15:00.000Z",
      payload: { destinationCountries: ["Turkey", "Germany"], departureDate: "2026-08-10", returnDate: "2026-08-24", tripPurpose: "Business", travelersCount: 1, plan: "Schengen Plus" },
      documents: [{ key: "passport", label: "جواز السفر", fileName: "passport.jpg", type: "image/jpeg", size: "420 KB", receivedAt: "2026-07-19T12:22:00.000Z", status: "received" }],
      internalNotes: []
    }
  ]
};

export const travelRequestService = createMockInsuranceRequestService(travelRequestModule);

