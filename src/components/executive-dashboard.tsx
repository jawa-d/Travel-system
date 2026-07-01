"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness, CarFront, ClipboardList, FileCheck2, FileClock,
  FileText, ShieldCheck, ShieldX, Sparkles, TrendingUp, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatLocaleNumber } from "@/lib/i18n";
import { workflowStatusDetails } from "@/lib/workflow-status";

type ChartPoint = { label: string; value: number };
type StatusPoint = { status: string; value: number };
type ActivityItem = {
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  status: string;
  amount?: number;
  createdAt: string;
};

export type ExecutiveDashboardData = {
  userName: string;
  metrics: {
    totalCustomers: number;
    totalPolicies: number;
    activePolicies: number;
    totalClaims: number;
    totalEndorsements: number;
    totalCancellations: number;
    totalAgents: number;
    totalMotorRequests: number;
    pendingMotorRequests: number;
  };
  policiesByMonth: ChartPoint[];
  customerGrowth: ChartPoint[];
  policiesByStatus: StatusPoint[];
  claimsByStatus: StatusPoint[];
  latestPolicies: ActivityItem[];
  latestClaims: ActivityItem[];
  latestEndorsements: ActivityItem[];
  latestMotorRequests: ActivityItem[];
  latestActivity: ActivityItem[];
};

const metricCards = [
  { key: "totalCustomers", label: "إجمالي العملاء", icon: Users },
  { key: "totalPolicies", label: "إجمالي الوثائق", icon: FileText },
  { key: "activePolicies", label: "الوثائق الفعالة", icon: ShieldCheck },
  { key: "totalClaims", label: "إجمالي المطالبات", icon: ClipboardList },
  { key: "totalEndorsements", label: "إجمالي الملاحق", icon: FileClock },
  { key: "totalCancellations", label: "إجمالي الإلغاءات", icon: ShieldX },
  { key: "totalAgents", label: "إجمالي الوكلاء", icon: BriefcaseBusiness },
  { key: "totalMotorRequests", label: "طلبات تأمين المركبات", icon: CarFront },
  { key: "pendingMotorRequests", label: "طلبات مركبات قيد المتابعة", icon: FileCheck2 }
] as const;

const statusColors: Record<string, string> = {
  ACTIVE: "#2f855a", DRAFT: "#727982", EXPIRED: "#AE8F50", CANCELLED: "#c24141",
  OPEN: "#3b82f6", UNDER_REVIEW: "#f59e0b", APPROVED: "#2f855a", REJECTED: "#dc2626", CLOSED: "#727982"
};

const policyLabels: Record<string, string> = {
  ACTIVE: "فعالة", DRAFT: "مسودة", EXPIRED: "منتهية", CANCELLED: "ملغاة"
};

const motorRequestLabels: Record<string, string> = {
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "قيد المراجعة",
  NEEDS_INFO: "بحاجة معلومات",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  DRAFT: "مسودة"
};

export function ExecutiveDashboard({ data }: { data: ExecutiveDashboardData }) {
  return (
    <div className="min-h-screen w-full bg-[#F1ECE2]">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-2xl bg-[#293545] p-6 text-white shadow-[0_28px_70px_-35px_rgba(41,53,69,.75)] sm:p-8"
      >
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge className="mb-4 border border-[#C6BEAE]/25 bg-[#AE8F50]/15 text-[#ead9b7]">
              <Sparkles className="h-3.5 w-3.5" /> Executive Insurance Overview
            </Badge>
            <h1 className="text-3xl font-black tracking-normal sm:text-4xl">مرحبا، {data.userName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              نظرة تنفيذية مباشرة على محفظة التأمين، العمليات، المطالبات، الوكلاء ونمو الأعمال.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-[#AE8F50] text-white hover:bg-[#9a7c40]"><Link href="/policies/new">إصدار وثيقة</Link></Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/reports">التقارير</Link></Button>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-9">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const value = data.metrics[card.key];
          return (
            <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} whileHover={{ y: -6, scale: 1.015 }}>
              <Card className="h-full border-white/70 bg-white/90 shadow-[0_12px_35px_-25px_rgba(41,53,69,.55)] backdrop-blur">
                <CardContent className="p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#293545] text-[#d9bd7e]"><Icon className="h-5 w-5" /></span>
                  <p className="mt-5 text-xs font-bold leading-5 text-[#727982]">{card.label}</p>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 + index * .05 }} className="mt-3 text-3xl font-black leading-none tracking-normal text-[#293545]">
                    {formatLocaleNumber(value, "ar")}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="الوثائق حسب الشهر" subtitle="Policies by Month" icon={FileCheck2}>
          <BarChart points={data.policiesByMonth} />
        </ChartCard>
        <ChartCard title="نمو العملاء" subtitle="Customer Growth Trend" icon={TrendingUp}>
          <LineChart points={data.customerGrowth} />
        </ChartCard>
        <ChartCard title="حالات المطالبات" subtitle="Claims by Status" icon={ClipboardList}>
          <DonutChart points={data.claimsByStatus} />
        </ChartCard>
        <ChartCard title="حالات الوثائق" subtitle="Policies by Status" icon={ShieldCheck}>
          <DonutChart points={data.policiesByStatus} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 2xl:grid-cols-5">
        <ActivityCard title="أحدث الوثائق" href="/policies" detailHref={(item) => `/policies/${item.id}`} items={data.latestPolicies} />
        <ActivityCard title="أحدث طلبات المركبات" href="/motor-requests" detailHref={(item) => `/motor-requests/${item.id}`} items={data.latestMotorRequests} />
        <ActivityCard title="أحدث المطالبات" href="/claims" items={data.latestClaims} />
        <ActivityCard title="أحدث الملاحق" href="/endorsements" items={data.latestEndorsements} />
        <ActivityCard title="آخر نشاطات النظام" href="/audit" items={data.latestActivity} />
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -3 }}>
      <Card className="h-full border-white/70 bg-white/90 shadow-[0_18px_45px_-32px_rgba(41,53,69,.6)]">
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle className="text-[#293545]">{title}</CardTitle><p className="mt-1 text-xs text-[#727982]">{subtitle}</p></div>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#AE8F50]/15 text-[#8d7138]"><Icon className="h-5 w-5" /></span>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function BarChart({ points }: { points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((item) => item.value));
  return (
    <div className="flex h-64 items-end gap-2">
      {points.map((point, index) => (
        <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-[#727982]">{formatLocaleNumber(point.value, "ar")}</span>
          <motion.div initial={{ height: 0 }} whileInView={{ height: `${Math.max(4, point.value / max * 180)}px` }} viewport={{ once: true }} transition={{ delay: index * .04 }} className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-[#293545] to-[#AE8F50]" />
          <span className="text-[9px] text-[#727982]">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ points }: { points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((item) => item.value));
  const coords = points.map((point, index) => ({
    x: points.length === 1 ? 50 : index / (points.length - 1) * 100,
    y: 92 - point.value / max * 78
  }));
  const path = coords.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  return (
    <div className="h-64">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-52 w-full overflow-visible">
        <defs><linearGradient id="growth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#AE8F50" stopOpacity=".35" /><stop offset="100%" stopColor="#AE8F50" stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#growth)" />
        <motion.path d={path} fill="none" stroke="#293545" strokeWidth="2.4" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
        {coords.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="1.6" fill="#AE8F50" />)}
      </svg>
      <div className="flex justify-between">{points.map((point, index) => <span key={index} className="text-[9px] text-[#727982]">{point.label}</span>)}</div>
    </div>
  );
}

function DonutChart({ points }: { points: StatusPoint[] }) {
  const total = Math.max(1, points.reduce((sum, item) => sum + item.value, 0));
  const segments = points.map((point, index) => {
    const percentage = point.value / total * 100;
    const offset = points.slice(0, index).reduce((sum, previous) => sum + previous.value / total * 100, 0);
    return { point, percentage, offset };
  });
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-6 sm:flex-row">
      <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#eee8dc" strokeWidth="6" />
        {segments.map(({ point, percentage, offset }) => (
          <motion.circle key={point.status} cx="21" cy="21" r="15.9" fill="none" stroke={statusColors[point.status] ?? "#AE8F50"} strokeWidth="6" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-offset} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} />
        ))}
      </svg>
      <div className="space-y-2">
        {points.map((point) => <div key={point.status} className="flex min-w-44 items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[point.status] ?? "#AE8F50" }} />{statusLabel(point.status)}</span><strong>{formatLocaleNumber(point.value, "ar")}</strong></div>)}
        {!points.length ? <p className="text-sm text-[#727982]">لا توجد بيانات بعد.</p> : null}
      </div>
    </div>
  );
}

function ActivityCard({ title, href, items, detailHref }: { title: string; href: string; items: ActivityItem[]; detailHref?: (item: ActivityItem) => string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className="h-full border-white/70 bg-white/90">
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base text-[#293545]">{title}</CardTitle><Button asChild variant="ghost" size="sm"><Link href={href}>عرض الكل</Link></Button></CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={detailHref?.(item) ?? href} className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-[#F1ECE2]/55 p-3 transition hover:border-[#AE8F50]/30 hover:bg-[#F1ECE2]">
              <div className="min-w-0"><p className="truncate text-xs font-black text-[#293545]" dir="ltr">{item.code}</p><p className="mt-1 truncate text-sm">{item.title}</p><p className="text-[10px] text-[#727982]">{item.subtitle ?? formatDate(item.createdAt)}</p></div>
              <div className="text-left">{item.amount !== undefined ? <p className="text-xs font-black text-[#8d7138]">{formatCurrency(item.amount)}</p> : null}<Badge className={`mt-1 ${statusClass(item.status)}`}>{statusLabel(item.status)}</Badge></div>
            </Link>
          ))}
          {!items.length ? <p className="py-10 text-center text-sm text-[#727982]">لا توجد سجلات بعد.</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function statusLabel(status: string) {
  if (status in workflowStatusDetails) return workflowStatusDetails[status as keyof typeof workflowStatusDetails].labelAr;
  if (status === "ACTIVITY") return "نشاط";
  if (status in motorRequestLabels) return motorRequestLabels[status];
  return policyLabels[status] ?? status;
}

function statusClass(status: string) {
  if (status in workflowStatusDetails) return workflowStatusDetails[status as keyof typeof workflowStatusDetails].className;
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "bg-red-50 text-red-700";
  if (status === "NEEDS_INFO") return "bg-amber-50 text-amber-700";
  if (status === "UNDER_REVIEW") return "bg-cyan-50 text-cyan-700";
  if (status === "SUBMITTED") return "bg-blue-50 text-blue-700";
  return status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700";
}
