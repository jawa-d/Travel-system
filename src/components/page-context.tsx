"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const pages = {
  ar: {
    "/": ["لوحة التحكم", "نظرة عامة على أعمال التأمين"],
    "/customers": ["العملاء", "إدارة ملفات وبيانات العملاء"],
    "/policies": ["الوثائق", "متابعة وثائق تأمين السفر"],
    "/policies/new": ["إصدار وثيقة", "إنشاء وثيقة تأمين جديدة"],
    "/claims": ["المطالبات", "إدارة مطالبات التأمين"],
    "/endorsements": ["الملاحق", "تعديلات الوثائق الصادرة"],
    "/cancellations": ["الإلغاءات", "إدارة إلغاء الوثائق"],
    "/pricing": ["حاسبة السعر", "حساب قسط التأمين"],
    "/reports": ["التقارير", "الإحصائيات والتحليلات"],
    "/agency": ["بوابة الوكلاء", "إنتاج وعمولات الوكلاء"],
    "/plans": ["خطط السفر", "التغطيات وأسعار الخطط"],
    "/countries": ["الدول", "تصنيف الوجهات والمخاطر"],
    "/notifications": ["الإشعارات", "تنبيهات النظام والوثائق"],
    "/audit": ["سجل التدقيق", "متابعة العمليات والتغييرات"],
    "/system": ["إدارة النظام", "المستخدمون والنسخ الاحتياطي"]
    ,"/lookups": ["القوائم الديناميكية", "إدارة القيم المرجعية"]
    ,"/profile": ["الملف الشخصي", "إعدادات الحساب والواجهة"]
  },
  en: {
    "/": ["Dashboard", "Insurance business overview"],
    "/customers": ["Customers", "Manage customer records"],
    "/policies": ["Policies", "Manage travel policies"],
    "/policies/new": ["Issue policy", "Create a new policy"],
    "/claims": ["Claims", "Manage insurance claims"],
    "/endorsements": ["Endorsements", "Policy modifications"],
    "/cancellations": ["Cancellations", "Policy cancellations"],
    "/pricing": ["Pricing", "Calculate insurance premiums"],
    "/reports": ["Reports", "Analytics and insights"],
    "/agency": ["Agency portal", "Agency production and commission"],
    "/plans": ["Travel plans", "Coverage and pricing"],
    "/countries": ["Countries", "Destination risk management"],
    "/notifications": ["Notifications", "System and policy alerts"],
    "/audit": ["Audit log", "Track system operations"],
    "/system": ["System", "Users and backup management"]
    ,"/lookups": ["Lookups", "Reference value management"]
    ,"/profile": ["Profile", "Account and interface settings"]
  }
} as const;

export function PageContext({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const exact = pages[locale][pathname as keyof typeof pages.ar];
  const parentPath = Object.keys(pages[locale])
    .filter((path) => path !== "/" && pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
  const context = exact ?? pages[locale][parentPath as keyof typeof pages.ar] ?? pages[locale]["/"];

  return (
    <div className="hidden min-w-0 sm:block">
      {pathname !== "/" ? (
        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400">
          <Link href="/" className="hover:text-primary">{locale === "ar" ? "الرئيسية" : "Home"}</Link>
          <ChevronLeft className="h-3 w-3" />
          <span className="truncate">{context[0]}</span>
        </div>
      ) : null}
      <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-foreground">{context[0]}</h2>
      <p className="truncate text-[11px] text-slate-500">{context[1]}</p>
    </div>
  );
}
