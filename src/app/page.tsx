import Link from "next/link";
import { AlertTriangle, Banknote, CarFront, FileQuestion, Plus, RefreshCw, Ship } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { referralStatusLabels } from "@/lib/referrals";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requirePagePermission("dashboard");
  const isBank = user.role === "BANK";
  const referralWhere = isBank ? { createdById: user.id } : {};
  const reportRequestWhere = isBank ? { requesterId: user.id } : {};
  const motorRequestWhere = user.role === "AGENT" ? { agentId: user.id } : {};

  const dashboardResult = await Promise.all([
    prisma.referral.count({ where: referralWhere }),
    prisma.referral.count({ where: { AND: [referralWhere, { status: { not: "ISSUED" } }] } }),
    prisma.reportRequest.count({ where: reportRequestWhere }),
    prisma.reportRequest.count({ where: { AND: [reportRequestWhere, { status: { in: ["PENDING", "IN_REVIEW"] } }] } }),
    prisma.motorInsuranceRequest.count({ where: motorRequestWhere }),
    prisma.motorInsuranceRequest.count({ where: { AND: [motorRequestWhere, { status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"] } }] } }),
    prisma.referralCommission.count(),
    prisma.motorCommission.count(),
    prisma.referral.findMany({
      where: referralWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, referralNumber: true, applicantName: true, status: true, createdAt: true }
    }),
    prisma.reportRequest.findMany({
      where: reportRequestWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, requestNumber: true, title: true, status: true, createdAt: true }
    }),
    prisma.motorInsuranceRequest.findMany({
      where: motorRequestWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, requestNumber: true, customerFullName: true, status: true, manufacturer: true, model: true, createdAt: true }
    })
  ]).catch((error) => {
    console.error("[dashboard] Failed to load dashboard", error);
    return null;
  });

  if (!dashboardResult) return <DashboardUnavailable />;

  const [
    totalReferrals,
    pendingReferrals,
    totalReportRequests,
    pendingReportRequests,
    totalMotorRequests,
    pendingMotorRequests,
    referralCommissions,
    motorCommissions,
    latestReferrals,
    latestReportRequests,
    latestMotorRequests
  ] = dashboardResult;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-sm font-semibold text-primary">Iraq Takaful Operations</div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-foreground sm:text-3xl">لوحة التحكم</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">متابعة الإحالات، طلبات التقارير، وطلبات تأمين المركبات.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" />إحالة جديدة</Link></Button>
          <Button asChild variant="outline"><Link href="/motor-requests/new"><CarFront className="h-4 w-4" />طلب مركبة</Link></Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Ship} label="الإحالات" value={totalReferrals} note={`${pendingReferrals} قيد المتابعة`} />
        <Metric icon={FileQuestion} label="طلبات التقرير" value={totalReportRequests} note={`${pendingReportRequests} قيد المعالجة`} />
        <Metric icon={CarFront} label="طلبات تأمين المركبات" value={totalMotorRequests} note={`${pendingMotorRequests} قيد المتابعة`} />
        <Metric icon={Banknote} label="العمولات" value={referralCommissions + motorCommissions} note={`${referralCommissions} إحالات / ${motorCommissions} مركبات`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Activity title="أحدث الإحالات" href="/referrals" items={latestReferrals.map((item) => ({
          href: `/referrals/${item.id}`,
          code: item.referralNumber,
          title: item.applicantName ?? "-",
          status: referralStatusLabels[item.status],
          createdAt: item.createdAt
        }))} />
        <Activity title="أحدث طلبات التقرير" href="/report-requests" items={latestReportRequests.map((item) => ({
          href: "/report-requests",
          code: item.requestNumber,
          title: item.title,
          status: item.status,
          createdAt: item.createdAt
        }))} />
        <Activity title="أحدث طلبات المركبات" href="/motor-requests" items={latestMotorRequests.map((item) => ({
          href: `/motor-requests/${item.id}`,
          code: item.requestNumber,
          title: item.customerFullName,
          status: item.status,
          subtitle: `${item.manufacturer} ${item.model}`,
          createdAt: item.createdAt
        }))} />
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Ship; label: string; value: number; note: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
      </CardContent>
    </Card>
  );
}

function Activity({ title, href, items }: { title: string; href: string; items: Array<{ href: string; code: string; title: string; status: string; subtitle?: string; createdAt: Date }> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href={href}>عرض الكل</Link></Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <Link key={`${item.href}-${item.code}`} href={item.href} className="block rounded-lg border bg-muted/15 p-3 transition hover:bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-black text-primary" dir="ltr">{item.code}</p>
                <p className="mt-1 truncate text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle ?? formatDate(item.createdAt)}</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{item.status}</Badge>
            </div>
          </Link>
        ))}
        {!items.length ? <p className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات بعد.</p> : null}
      </CardContent>
    </Card>
  );
}

function DashboardUnavailable() {
  return (
    <AppShell>
      <Card className="mx-auto mt-16 max-w-2xl border-amber-200 bg-amber-50/40">
        <CardContent className="p-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-black text-slate-950">تعذر تحميل لوحة التحكم</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">الاتصال بقاعدة البيانات غير مستقر حاليا.</p>
          <Button asChild className="mt-6"><Link href="/"><RefreshCw className="h-4 w-4" />إعادة المحاولة</Link></Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
