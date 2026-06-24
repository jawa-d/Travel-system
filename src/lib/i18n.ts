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
    label: "العربية",
    nativeLabel: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    dateLocale: "ar-IQ",
    fontClass: "font-arabic"
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
  }
} as const;

export function normalizeLocale(_locale?: string | null): Locale {
  void _locale;
  return "ar";
}

export function getDictionary(_locale: Locale) {
  void _locale;
  return dictionaries.ar;
}

export function formatLocaleDate(value: Date | string, _locale: Locale) {
  void _locale;
  return new Intl.DateTimeFormat(localeMeta.ar.dateLocale, { dateStyle: "medium" }).format(new Date(value));
}

export function formatLocaleNumber(value: number, _locale: Locale) {
  void _locale;
  return new Intl.NumberFormat(localeMeta.ar.dateLocale).format(value);
}
