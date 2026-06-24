"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Bell, BriefcaseBusiness, ChevronDown, CircleDollarSign, ClipboardList,
  FileClock, FilePlus2, FileText, Globe2, Home, Landmark, ListPlus, Menu,
  ScrollText, Settings2, ShieldCheck, Users, X, XCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import type { Role } from "@prisma/client";
import { can, type Permission } from "@/lib/rbac";

type NavItem = {
  href: string;
  ar: string;
  en: string;
  icon: typeof Home;
  featured?: boolean;
  permission?: Permission;
};

const groups: Array<{ ar: string; en: string; items: NavItem[]; collapsible?: boolean }> = [
  {
    ar: "الرئيسية", en: "Overview",
    items: [
      { href: "/", ar: "لوحة التحكم", en: "Dashboard", icon: Home, permission: "dashboard" },
      { href: "/policies/new", ar: "إصدار وثيقة", en: "Issue policy", icon: FilePlus2, featured: true, permission: "policiesWrite" }
    ]
  },
  {
    ar: "إدارة التأمين", en: "Insurance",
    items: [
      { href: "/policies", ar: "الوثائق", en: "Policies", icon: FileText, permission: "policiesRead" },
      { href: "/customers", ar: "العملاء", en: "Customers", icon: Users, permission: "customersRead" },
      { href: "/claims", ar: "المطالبات", en: "Claims", icon: ClipboardList, permission: "claimsRead" },
      { href: "/endorsements", ar: "الملاحق", en: "Endorsements", icon: FileClock, permission: "endorsementsRead" },
      { href: "/cancellations", ar: "الإلغاءات", en: "Cancellations", icon: XCircle, permission: "cancellationsRead" }
    ]
  },
  {
    ar: "الأعمال والتحليلات", en: "Business",
    items: [
      { href: "/pricing", ar: "حاسبة السعر", en: "Pricing", icon: CircleDollarSign, permission: "financeRead" },
      { href: "/reports", ar: "التقارير", en: "Reports", icon: BarChart3, permission: "reportsRead" },
      { href: "/agency", ar: "بوابة الوكلاء", en: "Agency portal", icon: BriefcaseBusiness, permission: "agencyRead" },
      { href: "/agent-accounts", ar: "حسابات الوكلاء", en: "Agent accounts", icon: Landmark, permission: "agentAccountsRead" }
    ]
  },
  {
    ar: "الإعدادات", en: "Settings", collapsible: true,
    items: [
      { href: "/plans", ar: "خطط السفر", en: "Travel plans", icon: ShieldCheck, permission: "plansWrite" },
      { href: "/countries", ar: "الدول", en: "Countries", icon: Globe2, permission: "countriesWrite" },
      { href: "/lookups", ar: "القوائم الديناميكية", en: "Lookups", icon: ListPlus, permission: "lookupsManage" },
      { href: "/notifications", ar: "الإشعارات", en: "Notifications", icon: Bell, permission: "notificationsRead" },
      { href: "/audit", ar: "سجل التدقيق", en: "Audit log", icon: ScrollText, permission: "auditRead" },
      { href: "/system", ar: "إدارة النظام", en: "System", icon: Settings2, permission: "systemManage" }
    ]
  }
];

export function AppNavigation({ locale, role, mobileOnly = false }: { locale: Locale; role: Role; mobileOnly?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isArabic = locale === "ar";
  const visibleGroups = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.permission || can(role, item.permission)) }))
    .filter((group) => group.items.length);

  function active(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function itemLink(item: NavItem) {
    const selected = active(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-[13px] font-semibold transition-all duration-200",
          selected && "bg-primary text-primary-foreground shadow-md shadow-primary/15",
          !selected && item.featured && "bg-primary/10 text-primary hover:bg-primary/15",
          !selected && !item.featured && "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        )}
      >
        <span className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
          selected ? "bg-white/15" : item.featured ? "bg-primary/10" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary dark:bg-slate-800"
        )}>
          <item.icon className="h-[17px] w-[17px]" />
        </span>
        <span className="truncate">{isArabic ? item.ar : item.en}</span>
        {selected ? <span className={cn("h-1.5 w-1.5 rounded-full bg-white/80", isArabic ? "mr-auto" : "ml-auto")} /> : null}
      </Link>
    );
  }

  const sidebar = (
    <aside className={cn(
      "fixed top-0 z-50 flex h-full w-[292px] flex-col bg-[#f8fafc] transition-transform duration-300 dark:bg-[#111827]",
      isArabic ? "right-0 border-l border-slate-200/80 dark:border-border" : "left-0 border-r border-slate-200/80 dark:border-border",
      mobileOnly
        ? open ? "translate-x-0 shadow-2xl" : isArabic ? "translate-x-full" : "-translate-x-full"
        : "hidden lg:flex lg:w-64 lg:translate-x-0 xl:w-72"
    )}>
      <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-slate-200/70 px-5 dark:border-border">
        <Link href="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/10 bg-white p-1.5 shadow-lg shadow-primary/10">
            <Image
              src="/iraq-takaful-logo.svg"
              alt="Iraq Takaful Insurance Company logo"
              width={44}
              height={44}
              priority
              className="h-full w-full object-contain"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black leading-5 tracking-tight text-slate-950 dark:text-foreground">TRINSU</span>
            <span className="block truncate text-[10px] font-medium text-slate-400">{isArabic ? "إدارة تأمين السفر" : "Travel Insurance"}</span>
          </span>
        </Link>
        {mobileOnly ? (
          <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800" aria-label={isArabic ? "إغلاق" : "Close"}>
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {visibleGroups.map((group) => group.collapsible ? (
          <details key={group.en} className="group/settings" open={group.items.some((item) => active(item.href)) || undefined}>
            <summary className="mb-1 flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {isArabic ? group.ar : group.en}
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/settings:rotate-180" />
            </summary>
            <div className="space-y-1">{group.items.map(itemLink)}</div>
          </details>
        ) : (
          <section key={group.en}>
            <p className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{isArabic ? group.ar : group.en}</p>
            <div className="space-y-1">{group.items.map(itemLink)}</div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200/70 p-4 dark:border-border">
        <div className="rounded-xl border border-primary/10 bg-gradient-to-l from-primary/[0.08] to-cyan-500/[0.04] p-3 dark:from-[#AE8F50]/15 dark:to-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold text-primary"><ShieldCheck className="h-4 w-4" />{isArabic ? "النظام يعمل بأمان" : "System is secure"}</div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{isArabic ? "يتم حفظ تغييراتك تلقائياً." : "Your changes are saved automatically."}</p>
        </div>
      </div>
    </aside>
  );

  if (!mobileOnly) return sidebar;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-border dark:bg-card dark:text-foreground lg:hidden" aria-label={isArabic ? "القائمة" : "Menu"}>
        <Menu className="h-5 w-5" />
      </button>
      {open ? <button className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label={isArabic ? "إغلاق" : "Close"} /> : null}
      {sidebar}
    </>
  );
}
