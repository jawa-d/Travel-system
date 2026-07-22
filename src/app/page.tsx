import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CarFront,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Plus,
  RefreshCw,
  Ship,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
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
  const referralCommissionWhere = isBank ? { referral: { createdById: user.id }, paid: true } : { paid: true };

  const dashboardResult = await Promise.all([
    prisma.referral.count({ where: referralWhere }),
    prisma.referral.count({ where: { AND: [referralWhere, { status: { not: "ISSUED" } }] } }),
    prisma.referral.count({ where: { AND: [referralWhere, { status: "ISSUED" }] } }),
    prisma.reportRequest.count({ where: reportRequestWhere }),
    prisma.reportRequest.count({ where: { AND: [reportRequestWhere, { status: { in: ["PENDING", "IN_REVIEW"] } }] } }),
    prisma.reportRequest.count({ where: { AND: [reportRequestWhere, { status: "COMPLETED" }] } }),
    isBank ? Promise.resolve(0) : prisma.motorInsuranceRequest.count({ where: motorRequestWhere }),
    isBank ? Promise.resolve(0) : prisma.motorInsuranceRequest.count({ where: { AND: [motorRequestWhere, { status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"] } }] } }),
    isBank ? Promise.resolve(0) : prisma.motorInsuranceRequest.count({ where: { AND: [motorRequestWhere, { status: "APPROVED" }] } }),
    prisma.referralCommission.count({ where: referralCommissionWhere }),
    isBank ? Promise.resolve(0) : prisma.motorCommission.count({ where: { paid: true } }),
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
    isBank ? Promise.resolve([]) : prisma.motorInsuranceRequest.findMany({
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
    issuedReferrals,
    totalReportRequests,
    pendingReportRequests,
    completedReportRequests,
    totalMotorRequests,
    pendingMotorRequests,
    approvedMotorRequests,
    referralCommissions,
    motorCommissions,
    latestReferrals,
    latestReportRequests,
    latestMotorRequests
  ] = dashboardResult;

  const totalWork = totalReferrals + totalReportRequests + totalMotorRequests;
  const pendingWork = pendingReferrals + pendingReportRequests + pendingMotorRequests;
  const completedWork = issuedReferrals + completedReportRequests + approvedMotorRequests;
  const completionRate = percent(completedWork, totalWork);
  const followUpRate = percent(pendingWork, totalWork);
  const today = new Intl.DateTimeFormat("ar-IQ", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-card">
        <div className="grid gap-0 xl:grid-cols-[1fr_360px]">
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                Iraq Takaful Operations
              </Badge>
              <span className="text-xs font-bold text-muted-foreground">{today}</span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-950 dark:text-foreground sm:text-3xl">لوحة التحكم</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {isBank
                    ? "مركز متابعة الإحالات وطلبات التقرير والعمولات الخاصة بجهتك، مع مؤشرات فورية للأعمال التي تحتاج متابعة."
                    : "مركز قيادة مختصر للإحالات وطلبات التقارير والمركبات والعمولات، مصمم للمتابعة اليومية واتخاذ القرار بسرعة."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/referrals/new"><Plus className="h-4 w-4" />إحالة جديدة</Link>
                </Button>
                {!isBank ? (
                  <Button asChild variant="outline">
                    <Link href="/motor-requests/new"><CarFront className="h-4 w-4" />طلب مركبة</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid border-t bg-slate-50/80 p-5 dark:bg-muted/10 sm:grid-cols-3 xl:border-r xl:border-t-0 xl:grid-cols-1">
            <Pulse label="نسبة الإنجاز" value={`${completionRate}%`} note={`${completedWork} من ${totalWork || 0} مكتملة`} tone="text-emerald-700" />
            <Pulse label="قيد المتابعة" value={pendingWork} note={`${followUpRate}% من الأعمال`} tone="text-amber-700" />
            <Pulse label="العمولات المصروفة" value={referralCommissions + motorCommissions} note={isBank ? "إحالات" : "إحالات ومركبات"} tone="text-sky-700" />
          </div>
        </div>
      </section>

      <section className={`mb-6 grid gap-4 sm:grid-cols-2 ${isBank ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
        <Metric icon={Ship} label="الإحالات" value={totalReferrals} note={`${pendingReferrals} قيد المتابعة`} accent="bg-cyan-50 text-cyan-700" />
        <Metric icon={FileQuestion} label="طلبات التقرير" value={totalReportRequests} note={`${pendingReportRequests} قيد المعالجة`} accent="bg-violet-50 text-violet-700" />
        {!isBank ? (
          <Metric icon={CarFront} label="طلبات المركبات" value={totalMotorRequests} note={`${pendingMotorRequests} قيد المتابعة`} accent="bg-indigo-50 text-indigo-700" />
        ) : null}
        <Metric
          icon={Banknote}
          label="العمولات"
          value={referralCommissions + motorCommissions}
          note={isBank ? `${referralCommissions} عمولات إحالات` : `${referralCommissions} إحالات / ${motorCommissions} مركبات`}
          accent="bg-emerald-50 text-emerald-700"
        />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <StatusCard icon={CheckCircle2} title="الأعمال المكتملة" value={completedWork} detail={`${completionRate}% من إجمالي الحركة`} />
        <StatusCard icon={Clock3} title="تحتاج متابعة" value={pendingWork} detail="إحالات وتقارير وطلبات مفتوحة" />
        <StatusCard icon={TrendingUp} title="حجم الحركة" value={totalWork} detail="إجمالي السجلات ضمن صلاحياتك" />
      </section>

      <section className={`grid gap-6 ${isBank ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
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
          status: reportStatusLabels[item.status] ?? item.status,
          createdAt: item.createdAt
        }))} />
        {!isBank ? (
          <Activity title="أحدث طلبات المركبات" href="/motor-requests" items={latestMotorRequests.map((item) => ({
            href: `/motor-requests/${item.id}`,
            code: item.requestNumber,
            title: item.customerFullName,
            status: motorStatusLabels[item.status] ?? item.status,
            subtitle: `${item.manufacturer} ${item.model}`,
            createdAt: item.createdAt
          }))} />
        ) : null}
      </section>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, note, accent }: { icon: typeof Ship; label: string; value: number; note: string; accent: string }) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:bg-card">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>
        </div>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${accent}`}><Icon className="h-6 w-6" /></span>
      </CardContent>
    </Card>
  );
}

function Pulse({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: string }) {
  return (
    <div className="border-b py-3 last:border-b-0 sm:border-b-0 sm:border-l sm:px-4 sm:last:border-l-0 xl:border-b xl:border-l-0 xl:px-0 xl:last:border-b-0">
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`} dir="ltr">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function StatusCard({ icon: Icon, title, value, detail }: { icon: typeof CheckCircle2; title: string; value: number; detail: string }) {
  return (
    <Card className="bg-white dark:bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-muted">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Activity({ title, href, items }: { title: string; href: string; items: Array<{ href: string; code: string; title: string; status: string; subtitle?: string; createdAt: Date }> }) {
  return (
    <Card className="bg-white dark:bg-card">
      <CardHeader className="flex-row items-center justify-between border-b bg-muted/10 p-5">
        <CardTitle className="text-base font-black">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>عرض الكل<ArrowUpRight className="h-4 w-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {items.map((item) => (
          <Link key={`${item.href}-${item.code}`} href={item.href} className="block rounded-lg border bg-white p-3 transition hover:border-primary/30 hover:bg-primary/5 dark:bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-black text-primary" dir="ltr">{item.code}</p>
                <p className="mt-1 truncate text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle ?? formatDate(item.createdAt)}</p>
              </div>
              <Badge className="shrink-0 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-muted dark:text-foreground">{item.status}</Badge>
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
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-black text-slate-950">تعذر تحميل لوحة التحكم</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">الاتصال بقاعدة البيانات غير مستقر حاليًا.</p>
          <Button asChild className="mt-6"><Link href="/"><RefreshCw className="h-4 w-4" />إعادة المحاولة</Link></Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

const reportStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  IN_REVIEW: "قيد المراجعة",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

const motorStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "قيد المراجعة",
  NEEDS_INFO: "بحاجة معلومات",
  APPROVED: "مقبول",
  REJECTED: "مرفوض"
};
