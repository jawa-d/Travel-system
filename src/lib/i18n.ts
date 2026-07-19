export type Locale = "ar" | "en";

export const localeMeta = {
  ar: {
    label: "العربية",
    nativeLabel: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    dateLocale: "en-US-u-nu-latn",
    numberLocale: "en-US",
    fontClass: "font-arabic"
  },
  en: {
    label: "English",
    nativeLabel: "English",
    dir: "rtl",
    htmlLang: "ar",
    dateLocale: "en-US-u-nu-latn",
    numberLocale: "en-US",
    fontClass: "font-arabic"
  }
} as const;

const arabicDictionary = {
  appName: "نظام تكافل العراق للتأمين التكافلي",
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
  travelInsuranceSystem: "نظام تكافل العراق للتأمين التكافلي",
  home: "الرئيسية",
  secureSystem: "النظام يعمل بأمان",
  autosave: "يتم حفظ تغييراتك تلقائيا.",
  validationError: "يرجى التحقق من الحقول المطلوبة.",
  success: "تمت العملية بنجاح.",
  error: "حدث خطأ غير متوقع."
} as const;

export const dictionaries = {
  ar: arabicDictionary,
  en: arabicDictionary
} as const;

export function toEnglishDigits(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

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
  return toEnglishDigits(new Intl.DateTimeFormat(localeMeta.ar.dateLocale, { dateStyle: "medium" }).format(new Date(value)));
}

export function formatLocaleNumber(value: number, _locale: Locale) {
  void _locale;
  return toEnglishDigits(new Intl.NumberFormat(localeMeta.ar.numberLocale).format(value));
}
