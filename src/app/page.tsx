import { subMonths } from "date-fns";
import Link from "next/link";
import { AlertTriangle, FileText, Plus, RefreshCw, Ship } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExecutiveDashboard, type ExecutiveDashboardData } from "@/components/executive-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { referralStatusLabels } from "@/lib/referrals";
import { visibleCustomerWhere, visiblePolicyWhere } from "@/lib/policy-access";

const monthFormatter = new Intl.DateTimeFormat("en-US-u-nu-latn", { month: "short" });

export default async function DashboardPage() {
  const user = await requirePagePermission("dashboard");
  if (user.role === "BANK") {
    const referrals = await prisma.referral.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, referralNumber: true, applicantName: true, status: true, totalPremium: true, currency: true, createdAt: true }
    }).catch((error) => {
      console.error("[dashboard] Failed to load bank referrals", error);
      return null;
    });
    if (!referrals) return <DashboardUnavailable />;
    const pending = referrals.filter((item) => item.status !== "ISSUED").length;
    const issued = referrals.filter((item) => item.status === "ISSUED").length;
    return (
      <AppShell>
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Ship className="h-4 w-4" />صلاحية البنوك</div>
            <h1 className="text-2xl font-black sm:text-3xl">لوحة إحالات البنك</h1>
            <p className="mt-2 text-sm text-muted-foreground">أرقام الإحالات التي تم رفعها من حسابك وحالة كل إحالة.</p>
          </div>
          <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" />رفع إحالة</Link></Button>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <BankMetric title="إجمالي الإحالات" value={referrals.length} />
          <BankMetric title="قيد المتابعة" value={pending} />
          <BankMetric title="تم الإصدار" value={issued} />
        </div>
        <Card>
          <CardContent className="divide-y p-0">
            {referrals.map((item) => (
              <Link key={item.id} href={`/referrals/${item.id}`} className="flex flex-col justify-between gap-2 p-4 hover:bg-muted/30 sm:flex-row sm:items-center">
                <div>
                  <p className="font-mono text-sm font-black text-primary" dir="ltr">{item.referralNumber}</p>
                  <p className="mt-1 font-bold">{item.applicantName}</p>
                </div>
                <div className="text-sm text-muted-foreground">{referralStatusLabels[item.status]}</div>
              </Link>
            ))}
            {!referrals.length ? <div className="p-10 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-3 h-8 w-8" />لا توجد إحالات مرفوعة من حسابك بعد.</div> : null}
          </CardContent>
        </Card>
      </AppShell>
    );
  }
  const policyWhere = visiblePolicyWhere(user);
  const customerWhere = visibleCustomerWhere(user);
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const motorRequestWhere = user.role === "AGENT" ? { agentId: user.id } : {};
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const dashboardResult = await Promise.all([
    prisma.customer.count({ where: customerWhere }),
    prisma.policy.count({ where: policyWhere }),
    prisma.policy.count({ where: { AND: [policyWhere, { status: "ACTIVE" }] } }),
    prisma.claim.count({ where: { policy: policyWhere } }),
    prisma.endorsement.count({ where: { policy: policyWhere } }),
    prisma.cancellation.count({ where: { policy: policyWhere } }),
    isSuperAdmin ? prisma.user.count({ where: { role: "AGENT" } }) : Promise.resolve(1),
    prisma.motorInsuranceRequest.count({ where: motorRequestWhere }),
    prisma.motorInsuranceRequest.count({ where: { AND: [motorRequestWhere, { status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"] } }] } }),
    prisma.policy.findMany({ where: { AND: [policyWhere, { createdAt: { gte: since } }] }, select: { createdAt: true } }),
    prisma.customer.findMany({ where: { AND: [customerWhere, { createdAt: { gte: since } }] }, select: { createdAt: true } }),
    prisma.policy.groupBy({ by: ["status"], where: policyWhere, _count: true }),
    prisma.claim.groupBy({ by: ["status"], where: { policy: policyWhere }, _count: true }),
    prisma.policy.findMany({
      where: policyWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, policyNumber: true, status: true, premium: true, createdAt: true,
        customer: { select: { arabicName: true } }
      }
    }),
    prisma.claim.findMany({
      where: { policy: policyWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, claimNumber: true, status: true, createdAt: true,
        customer: { select: { arabicName: true } }
      }
    }),
    prisma.endorsement.findMany({
      where: { policy: policyWhere },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, endorsementNumber: true, status: true, endorsementType: true, createdAt: true,
        policy: { select: { policyNumber: true } }
      }
    }),
    prisma.motorInsuranceRequest.findMany({
      where: motorRequestWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        requestNumber: true,
        status: true,
        customerFullName: true,
        manufacturer: true,
        model: true,
        createdAt: true
      }
    }),
    prisma.activity.findMany({
      where: isSuperAdmin ? {} : { actorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, action: true, entity: true, createdAt: true,
        actor: { select: { name: true } }
      }
    })
  ]).catch((error) => {
    console.error("[dashboard] Failed to load executive dashboard", error);
    return null;
  });

  if (!dashboardResult) return <DashboardUnavailable />;

  const [
    totalCustomers,
    totalPolicies,
    activePolicies,
    totalClaims,
    totalEndorsements,
    totalCancellations,
    totalAgents,
    totalMotorRequests,
    pendingMotorRequests,
    policyDates,
    customerDates,
    policyStatuses,
    claimStatuses,
    latestPolicies,
    latestClaims,
    latestEndorsements,
    latestMotorRequests,
    latestActivity
  ] = dashboardResult;

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(new Date(), 11 - index);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthFormatter.format(date),
      policies: 0,
      customers: 0
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));
  policyDates.forEach(({ createdAt }) => {
    const item = monthMap.get(`${createdAt.getFullYear()}-${createdAt.getMonth()}`);
    if (item) item.policies += 1;
  });
  customerDates.forEach(({ createdAt }) => {
    const item = monthMap.get(`${createdAt.getFullYear()}-${createdAt.getMonth()}`);
    if (item) item.customers += 1;
  });

  const data: ExecutiveDashboardData = {
    userName: user.name ?? "مدير النظام",
    metrics: {
      totalCustomers,
      totalPolicies,
      activePolicies,
      totalClaims,
      totalEndorsements,
      totalCancellations,
      totalAgents,
      totalMotorRequests,
      pendingMotorRequests
    },
    policiesByMonth: months.map(({ label, policies }) => ({ label, value: policies })),
    customerGrowth: months.map(({ label, customers }) => ({ label, value: customers })),
    policiesByStatus: policyStatuses.map((item) => ({ status: item.status, value: item._count })),
    claimsByStatus: claimStatuses.map((item) => ({ status: item.status, value: item._count })),
    latestPolicies: latestPolicies.map((item) => ({
      id: item.id,
      code: item.policyNumber,
      title: item.customer.arabicName,
      status: item.status,
      amount: Number(item.premium),
      createdAt: item.createdAt.toISOString()
    })),
    latestClaims: latestClaims.map((item) => ({
      id: item.id,
      code: item.claimNumber,
      title: item.customer.arabicName,
      status: item.status,
      createdAt: item.createdAt.toISOString()
    })),
    latestEndorsements: latestEndorsements.map((item) => ({
      id: item.id,
      code: item.endorsementNumber,
      title: item.policy.policyNumber,
      status: item.status,
      subtitle: item.endorsementType,
      createdAt: item.createdAt.toISOString()
    })),
    latestMotorRequests: latestMotorRequests.map((item) => ({
      id: item.id,
      code: item.requestNumber,
      title: item.customerFullName,
      status: item.status,
      subtitle: `${item.manufacturer} ${item.model}`,
      createdAt: item.createdAt.toISOString()
    })),
    latestActivity: latestActivity.map((item) => ({
      id: item.id,
      code: item.action,
      title: item.entity,
      subtitle: item.actor?.name ?? "النظام",
      status: "ACTIVITY",
      createdAt: item.createdAt.toISOString()
    }))
  };

  return <AppShell><ExecutiveDashboard data={data} /></AppShell>;
}

function BankMetric({ title, value }: { title: string; value: string | number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></CardContent></Card>;
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
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            الاتصال بقاعدة البيانات غير مستقر حالياً. باقي صفحات النظام ستعمل عند توفر الاتصال، ويمكنك إعادة المحاولة أو الانتقال مباشرة إلى سجل الإحالات.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild><Link href="/"><RefreshCw className="h-4 w-4" />إعادة المحاولة</Link></Button>
            <Button asChild variant="outline"><Link href="/referrals"><Ship className="h-4 w-4" />سجل الإحالات</Link></Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
