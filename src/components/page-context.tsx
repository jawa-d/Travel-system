"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const pages = {
  "/": ["لوحة التحكم", "متابعة الإحالات وطلبات المركبات"],
  "/referrals": ["الإحالات", "إدارة الإحالات ومتابعتها"],
  "/referrals/new": ["إحالة جديدة", "رفع إحالة جديدة"],
  "/report-requests": ["إدارة طلبات التقرير", "طلبات التقارير الواردة"],
  "/report-requests/new": ["طلب تقرير", "إنشاء طلب تقرير"],
  "/referral-sla": ["SLA / KPIs", "مؤشرات أداء الإحالات"],
  "/referral-commissions": ["عمولات الإحالات", "صرف ومتابعة عمولات الإحالات"],
  "/referral-reports": ["تقرير الإحالات", "تقارير الإحالات والعمولات"],
  "/motor-requests": ["طلبات تأمين المركبات", "إدارة طلبات تأمين المركبات"],
  "/motor-requests/new": ["طلب تأمين مركبة", "إنشاء طلب تأمين مركبة"],
  "/motor-accounts": ["حسابات وثائق المركبات", "حسابات وثائق المركبات"],
  "/motor-commissions": ["عمولات المركبات", "صرف ومتابعة عمولات المركبات"],
  "/lookups": ["القوائم الديناميكية", "إدارة القيم المرجعية"],
  "/notifications": ["الإشعارات", "تنبيهات النظام"],
  "/audit": ["سجل التدقيق", "متابعة العمليات والتغييرات"],
  "/system": ["إدارة النظام", "المستخدمون والنسخ الاحتياطي"],
  "/profile": ["الملف الشخصي", "إعدادات الحساب والواجهة"]
} as const;

export function PageContext({}: { locale?: Locale }) {
  const pathname = usePathname();
  const exact = pages[pathname as keyof typeof pages];
  const parentPath = Object.keys(pages)
    .filter((path) => path !== "/" && pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
  const context = exact ?? pages[parentPath as keyof typeof pages] ?? pages["/"];

  return (
    <div className="hidden min-w-0 sm:block">
      {pathname !== "/" ? (
        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400">
          <Link href="/" className="hover:text-primary">الرئيسية</Link>
          <ChevronLeft className="h-3 w-3" />
          <span className="truncate">{context[0]}</span>
        </div>
      ) : null}
      <h2 className="truncate text-sm font-extrabold leading-5 text-slate-900 dark:text-foreground">{context[0]}</h2>
      <p className="truncate text-[11px] leading-4 text-slate-500 dark:text-muted-foreground">{context[1]}</p>
    </div>
  );
}
