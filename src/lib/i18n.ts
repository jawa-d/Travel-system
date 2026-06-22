export type Locale = "ar" | "en";

export const dictionaries = {
  ar: {
    appName: "إدارة تأمين السفر",
    dashboard: "لوحة التحكم",
    customers: "العملاء",
    plans: "خطط السفر",
    countries: "الدول",
    policies: "الوثائق",
    issuePolicy: "إصدار وثيقة",
    pricing: "حاسبة السعر",
    claims: "المطالبات",
    reports: "التقارير",
    agency: "بوابة الوكلاء",
    endorsements: "الملاحق",
    cancellations: "الإلغاءات",
    notifications: "الإشعارات",
    audit: "سجل التدقيق",
    logout: "تسجيل الخروج"
  },
  en: {
    appName: "Travel Insurance Management",
    dashboard: "Dashboard",
    customers: "Customers",
    plans: "Travel Plans",
    countries: "Countries",
    policies: "Policies",
    issuePolicy: "Issue Policy",
    pricing: "Pricing",
    claims: "Claims",
    reports: "Reports",
    agency: "Agency Portal",
    endorsements: "Endorsements",
    cancellations: "Cancellations",
    notifications: "Notifications",
    audit: "Audit Log",
    logout: "Logout"
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.ar;
}
