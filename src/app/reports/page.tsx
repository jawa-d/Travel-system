import Link from "next/link";
import { endOfDay, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { BarChart3, CalendarRange, Download, FileText, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoClaims } from "@/lib/demo-claim-store";
import { getDemoPolicies } from "@/lib/demo-policy-store";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { requirePagePermission } from "@/lib/page-guard";
import { visiblePolicyWhere } from "@/lib/policy-access";

type Period = "daily" | "monthly" | "yearly" | "all";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const user = await requirePagePermission("reportsRead");
  const policyWhere = visiblePolicyWhere(user);
  const params = await searchParams;
  const period = (["daily", "monthly", "yearly", "all"].includes(params.period ?? "") ? params.period : "monthly") as Period;
  const now = new Date();
  const from = params.from ? startOfDay(new Date(params.from)) : period === "daily" ? startOfDay(now) : period === "yearly" ? startOfYear(now) : period === "all" ? undefined : startOfMonth(now);
  const to = params.to ? endOfDay(new Date(params.to)) : undefined;

  const policies = isDirectAccessEnabled()
    ? getDemoPolicies().filter((item) => (!from || item.createdAt >= from) && (!to || item.createdAt <= to))
    : await prisma.policy.findMany({
        where: { AND: [policyWhere, from || to ? { createdAt: { gte: from, lte: to } } : {}] },
        include: { customer: true, destinationCountry: true, travelPlan: true },
        orderBy: { createdAt: "desc" }
      });
  const claims = isDirectAccessEnabled()
    ? getDemoClaims().filter((item) => (!from || item.createdAt >= from) && (!to || item.createdAt <= to))
    : await prisma.claim.findMany({ where: { AND: [{ policy: policyWhere }, from || to ? { createdAt: { gte: from, lte: to } } : {}] } });

  const destinations = countTop(policies.map((item) => item.destinationCountry.nameAr));
  const customers = countTop(policies.map((item) => item.customer.arabicName));
  const plans = countTop(policies.map((item) => item.travelPlan.name));
  const totalPremium = policies.reduce((sum, item) => sum + Number(item.premium), 0);
  const maxDestination = Math.max(1, ...destinations.map((item) => item.count));
  const query = new URLSearchParams({ period, ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}) });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h1 className="text-2xl font-bold sm:text-3xl">التقارير والتحليلات</h1><p className="mt-1 text-sm text-muted-foreground">مؤشرات فعلية بأسماء العملاء والوجهات مع اختيار الفترة والتصدير.</p></div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/api/reports?${query}&format=xlsx`}><Download className="h-4 w-4" />Excel</Link></Button>
          <Button asChild><Link href={`/api/reports?${query}&format=pdf`}><FileText className="h-4 w-4" />PDF</Link></Button>
        </div>
      </div>

      <form className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[180px_1fr_1fr_auto]">
        <select name="period" defaultValue={period} className="h-11 rounded-md border bg-background px-3 text-sm">
          <option value="daily">اليوم</option><option value="monthly">هذا الشهر</option><option value="yearly">هذه السنة</option><option value="all">كل الفترات</option>
        </select>
        <input name="from" type="date" defaultValue={params.from} className="h-11 rounded-md border bg-background px-3 text-sm" aria-label="من تاريخ" />
        <input name="to" type="date" defaultValue={params.to} className="h-11 rounded-md border bg-background px-3 text-sm" aria-label="إلى تاريخ" />
        <Button><CalendarRange className="h-4 w-4" />تطبيق</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileText} label="إجمالي الوثائق" value={policies.length} />
        <Metric icon={BarChart3} label="إجمالي الأقساط" value={formatCurrency(totalPremium)} />
        <Metric icon={Users} label="العملاء الفريدون" value={new Set(policies.map((item) => item.customer.id)).size} />
        <Metric icon={FileText} label="المطالبات" value={claims.length} />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader><CardTitle>أعلى الوجهات</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {destinations.map((item) => <div key={item.name}><div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><strong>{item.count}</strong></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.count / maxDestination * 100}%` }} /></div></div>)}
            {!destinations.length ? <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات ضمن الفترة.</p> : null}
          </CardContent>
        </Card>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <Ranking title="أعلى العملاء" items={customers} />
          <Ranking title="الخطط الأكثر استخدامًا" items={plans} />
        </div>
      </div>
    </AppShell>
  );
}

function countTop(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}

function Metric({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div></CardContent></Card>;
}

function Ranking({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-2">{items.map((item, index) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm"><span><strong className="ml-2 text-primary">{index + 1}</strong>{item.name}</span><strong>{item.count}</strong></div>)}{!items.length ? <p className="text-sm text-muted-foreground">لا توجد بيانات</p> : null}</CardContent></Card>;
}
