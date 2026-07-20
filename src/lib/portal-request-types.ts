import type { PortalRequestType } from "@prisma/client";

export const portalRequestTypeLabels: Record<PortalRequestType, string> = {
  MOTOR: "تأمين المركبات",
  CIVIL_LIABILITY: "مسؤولية مدنية",
  TRAVEL: "تأمين سفر",
  BUILDING_GLASS: "زجاج المباني",
  FIDELITY_GUARANTEE: "خيانة الأمانة",
  CASH_IN_SAFE: "حفظ النقد",
  CONTRACTORS_ALL_RISKS: "جميع أخطار المقاولين",
  PERSONAL_ACCIDENT: "الحوادث الشخصية",
  WORKERS_COMPENSATION: "إصابات العمال"
};
