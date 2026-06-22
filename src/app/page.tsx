import { addDays, startOfDay, startOfMonth } from "date-fns";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft, BriefcaseBusiness, CalendarClock, CircleDollarSign, FileCheck2,
  FilePlus2, ShieldAlert, Sparkles, UserPlus, Users
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardInsights } from "@/components/dashboard-insights";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { getDemoClaims } from "@/lib/demo-claim-store";
import { requirePagePermission } from "@/lib/page-guard";
import { visiblePolicyWhere } from "@/lib/policy-access";

async function getDashboardData() {
  if (isDirectAccessEnabled()) {
    const policies = getDemoPolicies();
    const claims = getDemoClaims();
    return {
      databaseReady: false,
      todayCount: policies.filter((item) => item.createdAt >= startOfDay(new Date())).length,
      monthCount: policies.filter((item) => item.createdAt >= startOfMonth(new Date())).length,
      totalPremiums: formatCurrency(policies.filter((item) => item.status === "ACTIVE").reduce((sum, item) => sum + item.premium, 0)),
      expiringSoon: policies.filter((item) => item.status === "ACTIVE" && item.returnDate <= addDays(new Date(), 14)).length,
      activities: [],
      destinations: aggregateNames(policies.map((item) => item.destinationCountry.nameAr)),
      statuses: aggregateStatuses([...policies.map((item) => item.status), ...claims.map((item) => item.status)])
    };
  }

  const today = startOfDay(new Date());
  const month = startOfMonth(new Date());
  const soon = addDays(new Date(), 14);

  try {
    const [todayCount, monthCount, premiums, expiringSoon, activities, destinationGroups, policyStatuses, claimStatuses] = await Promise.all([
      prisma.policy.count({ where: { createdAt: { gte: today } } }),
      prisma.policy.count({ where: { createdAt: { gte: month } } }),
      prisma.policy.aggregate({ _sum: { premium: true }, where: { status: "ACTIVE" } }),
      prisma.policy.count({ where: { returnDate: { gte: new Date(), lte: soon }, status: "ACTIVE" } }),
      prisma.activity.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.policy.groupBy({ by: ["destinationCountryId"], _count: true, orderBy: { _count: { destinationCountryId: "desc" } }, take: 6 }),
      prisma.policy.groupBy({ by: ["status"], _count: true }),
      prisma.claim.groupBy({ by: ["status"], _count: true })
    ]);
    const destinationNames = await prisma.country.findMany({
      where: { id: { in: destinationGroups.map((item) => item.destinationCountryId) } },
      select: { id: true, nameAr: true }
    });
    const names = new Map(destinationNames.map((item) => [item.id, item.nameAr]));
    return {
      databaseReady: true, todayCount, monthCount,
      totalPremiums: formatCurrency(String(premiums._sum.premium ?? 0)),
      expiringSoon, activities,
      destinations: destinationGroups.map((item) => ({ name: names.get(item.destinationCountryId) ?? item.destinationCountryId, count: item._count })),
      statuses: [
        ...policyStatuses.map((item) => ({ status: item.status, count: item._count })),
        ...claimStatuses.map((item) => ({ status: item.status, count: item._count }))
      ]
    };
  } catch {
    return { databaseReady: false, todayCount: 0, monthCount: 0, totalPremiums: formatCurrency(0), expiringSoon: 0, activities: [], destinations: [], statuses: [] };
  }
}

export default async function DashboardPage() {
  const user = await requirePagePermission("dashboard");
  if (user.role === "AGENT") {
    const [policyCount, activePolicyCount, customerCount] = await Promise.all([
      prisma.policy.count({ where: visiblePolicyWhere(user) }),
      prisma.policy.count({ where: { AND: [visiblePolicyWhere(user), { status: "ACTIVE" }] } }),
      prisma.customer.count()
    ]);
    return (
      <AppShell>
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-primary via-cyan-600 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              <Sparkles className="h-3.5 w-3.5" />بوابة الوكيل
            </Badge>
            <h1 className="text-2xl font-black sm:text-4xl">
              أهلاً وسهلاً، {user.name ?? "وكيلنا العزيز"} 👋
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              نتمنى لك يومًا موفقًا. يمكنك إدارة العملاء وإصدار وثائق التأمين بسرعة من هنا.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-primary hover:bg-white/90">
                <Link href="/policies/new"><FilePlus2 className="h-4 w-4" />إصدار وثيقة جديدة</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/customers"><UserPlus className="h-4 w-4" />إضافة أو تعديل عميل</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <AgentMetric icon={BriefcaseBusiness} label="إجمالي وثائقي" value={policyCount} tone="bg-primary/10 text-primary" />
          <AgentMetric icon={FileCheck2} label="الوثائق الفعالة" value={activePolicyCount} tone="bg-emerald-50 text-emerald-600" />
          <AgentMetric icon={Users} label="العملاء المتاحون" value={customerCount} tone="bg-blue-50 text-blue-600" />
        </div>
      </AppShell>
    );
  }
  const data = await getDashboardData();
  const locale = ((await cookies()).get("locale")?.value === "en" ? "en" : "ar") satisfies Locale;
  const ar = locale === "ar";
  const cards = [
    { label: ar ? "وثائق اليوم" : "Policies today", value: data.todayCount, icon: FileCheck2, tone: "text-emerald-600 bg-emerald-50", note: ar ? "إصدار جديد" : "New issuance" },
    { label: ar ? "وثائق الشهر" : "Policies this month", value: data.monthCount, icon: CalendarClock, tone: "text-blue-600 bg-blue-50", note: ar ? "إجمالي الشهر الحالي" : "Current month total" },
    { label: ar ? "إجمالي الأقساط" : "Total premiums", value: data.totalPremiums, icon: CircleDollarSign, tone: "text-primary bg-primary/10", note: ar ? "الوثائق الفعالة" : "Active policies" },
    { label: ar ? "تنتهي قريباً" : "Expiring soon", value: data.expiringSoon, icon: ShieldAlert, tone: "text-amber-600 bg-amber-50", note: ar ? "خلال 14 يوماً" : "Within 14 days" }
  ];

  return (
    <AppShell>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="mb-3 gap-1.5 border-primary/15 bg-primary/10 px-3 py-1 text-primary">
            <Sparkles className="h-3.5 w-3.5" />{ar ? "نظرة عامة" : "Overview"}
          </Badge>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{ar ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="mt-1 text-sm text-slate-500">{ar ? "كل ما تحتاجه لإدارة أعمال التأمين من مكان واحد." : "Everything you need to run insurance operations in one place."}</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl bg-white">
          <Link href="/reports">{ar ? "عرض التقارير" : "View reports"}<ArrowLeft className="h-4 w-4" /></Link>
        </Button>
      </div>

      {!data.databaseReady ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 shadow-none">
          <CardContent className="pt-6 text-sm text-amber-900">
            {ar ? "وضع العرض التجريبي مفعّل حالياً؛ ستظهر البيانات الفعلية بعد تجهيز اتصال قاعدة البيانات." : "Demo mode is active; live figures will appear when the database connection is ready."}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-500">{card.label}</CardTitle>
                <p className="mt-1 text-[11px] text-slate-400">{card.note}</p>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span>
            </CardHeader>
            <CardContent className="text-3xl font-black tracking-tight text-slate-950">{card.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{ar ? "آخر الأنشطة" : "Recent activity"}</CardTitle>
              <p className="mt-1 text-xs text-slate-500">{ar ? "آخر التحديثات داخل النظام" : "Latest updates across the system"}</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/audit">{ar ? "عرض الكل" : "View all"}</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-primary shadow-sm"><FileCheck2 className="h-4 w-4" /></span>
                  <div>
                    <div className="font-medium text-slate-800">{activity.action} {activity.entity}</div>
                    <div className="text-xs text-slate-500">{activity.actor?.name ?? (ar ? "النظام" : "System")}</div>
                  </div>
                </div>
                <Badge className="border-0 bg-white text-slate-500">{formatDate(activity.createdAt)}</Badge>
              </div>
            ))}
            {!data.activities.length ? (
              <div className="grid min-h-48 place-items-center rounded-xl border border-dashed bg-slate-50/50 text-center">
                <div>
                  <FileCheck2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">{ar ? "لا توجد أنشطة بعد" : "No activity yet"}</p>
                  <p className="mt-1 text-xs text-slate-400">{ar ? "ستظهر عمليات النظام هنا تلقائياً." : "System events will appear here automatically."}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-lg">
          <CardHeader>
            <CardTitle>{ar ? "إجراءات سريعة" : "Quick actions"}</CardTitle>
            <p className="text-xs text-slate-400">{ar ? "ابدأ أهم المهام بنقرة واحدة" : "Start frequent tasks in one click"}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction href="/policies/new" icon={FilePlus2} title={ar ? "إصدار وثيقة جديدة" : "Issue a new policy"} subtitle={ar ? "تسعير وإصدار مباشر" : "Price and issue instantly"} primary />
            <QuickAction href="/customers" icon={Users} title={ar ? "إضافة عميل" : "Add a customer"} subtitle={ar ? "تسجيل بيانات مؤمَّن جديد" : "Register a new insured person"} />
            <QuickAction href="/pricing" icon={CircleDollarSign} title={ar ? "حساب السعر" : "Calculate price"} subtitle={ar ? "عرض سعر سريع قبل الإصدار" : "Get a quote before issuance"} />
          </CardContent>
        </Card>
      </div>
      <DashboardInsights destinations={data.destinations} statuses={data.statuses} />
    </AppShell>
  );
}

function AgentMetric({ icon: Icon, label, value, tone }: {
  icon: typeof FileCheck2;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function aggregateNames(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}

function aggregateStatuses(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([status, count]) => ({ status, count }));
}

function QuickAction({ href, icon: Icon, title, subtitle, primary = false }: {
  href: string; icon: typeof FilePlus2; title: string; subtitle: string; primary?: boolean;
}) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-xl p-3.5 transition-all hover:scale-[1.01] ${primary ? "bg-primary" : "bg-white/5 hover:bg-white/10"}`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Icon className="h-5 w-5" /></span>
      <span><span className="block text-sm font-bold">{title}</span><span className={primary ? "text-xs text-white/70" : "text-xs text-slate-400"}>{subtitle}</span></span>
    </Link>
  );
}
