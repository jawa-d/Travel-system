export type Locale = "ar" | "en";

export const localeMeta = {
  ar: {
    label: "العربية",
    nativeLabel: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    dateLocale: "ar-IQ",
    fontClass: "font-arabic"
  },
  en: {
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
    htmlLang: "en",
    dateLocale: "en-US",
    fontClass: "font-english"
  }
} as const;

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
    agentAccounts: "حسابات الوكلاء",
    endorsements: "الملاحق",
    cancellations: "الإلغاءات",
    notifications: "الإشعارات",
    audit: "سجل التدقيق",
    settings: "الإعدادات",
    system: "إدارة النظام",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    export: "تصدير",
    search: "بحث",
    language: "اللغة",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    systemTheme: "النظام",
    loading: "جاري التحميل...",
    travelInsuranceSystem: "نظام إدارة تأمين السفر",
    home: "الرئيسية",
    secureSystem: "النظام يعمل بأمان",
    autosave: "يتم حفظ تغييراتك تلقائياً.",
    validationError: "يرجى التحقق من الحقول المطلوبة.",
    success: "تمت العملية بنجاح.",
    error: "حدث خطأ غير متوقع."
  },
  en: {
    appName: "Travel Insurance Management",
    dashboard: "Dashboard",
    customers: "Customers",
    plans: "Travel Plans",
    countries: "Countries",
    policies: "Policies",
    issuePolicy: "Issue Policy",
    pricing: "Pricing Calculator",
    claims: "Claims",
    reports: "Reports",
    agency: "Agency Portal",
    agentAccounts: "Agent Accounts",
    endorsements: "Endorsements",
    cancellations: "Cancellations",
    notifications: "Notifications",
    audit: "Audit Logs",
    settings: "Settings",
    system: "System",
    profile: "Profile",
    logout: "Logout",
    export: "Export",
    search: "Search",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    systemTheme: "System",
    loading: "Loading...",
    travelInsuranceSystem: "Travel Insurance Management System",
    home: "Home",
    secureSystem: "System is secure",
    autosave: "Your changes are saved automatically.",
    validationError: "Please check the required fields.",
    success: "Operation completed successfully.",
    error: "Something went wrong."
  }
} as const;

export function normalizeLocale(locale?: string | null): Locale {
  return locale === "en" ? "en" : "ar";
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.ar;
}

export function formatLocaleDate(value: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(localeMeta[locale].dateLocale, { dateStyle: "medium" }).format(new Date(value));
}

export function formatLocaleNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(localeMeta[locale].dateLocale).format(value);
}
